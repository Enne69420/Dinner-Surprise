import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Declare global variable for TypeScript
declare global {
  var hasLoggedEnvVars: boolean;
}

export async function middleware(request: NextRequest) {
  // Check if the request is for a protected path
  const path = request.nextUrl.pathname;
  
  // Only redirect API routes for authentication
  if (path.startsWith('/api/') && !path.startsWith('/api/public/')) {
    // Skip auth check for API routes except for user-specific ones
    if (path.includes('/grocery-list') || 
        path.includes('/recipes') || 
        path.includes('/generate-recipe')) {
      // Continue with auth check for these specific API routes
    } else {
      return NextResponse.next();
    }
  }
  
  // List of auth-only paths (both free and premium users can access)
  const authPaths = ['/grocery-list'];
  
  // If the request is for an auth path, check authentication
  if (authPaths.some(authPath => path.startsWith(authPath))) {
    try {
      // Check for auth redirect loop to prevent endless redirects
      const url = request.nextUrl.clone();
      const redirectCount = parseInt(url.searchParams.get('redirectCount') || '0');
      
      if (redirectCount > 1) {
        console.warn('[Middleware] Detected redirect loop, allowing access');
        return NextResponse.next();
      }
      
      // Get all cookies from the request to ensure we have session data
      const allCookies = request.cookies;
      
      // Try multiple possible cookie name formats
      const supabaseUrlPart = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0];
      const possibleCookieNames = [
        `sb-${supabaseUrlPart}-auth-token`,
        `supabase-auth-token`,
        `sb-${supabaseUrlPart?.toLowerCase()}-auth-token`
      ];
      
      let hasAuthCookie = false;
      
      for (const cookieName of possibleCookieNames) {
        if (allCookies.has(cookieName)) {
          hasAuthCookie = true;
          break;
        }
      }
      
      // Special case: if it's the grocery-list page, allow any user to access it
      // This makes sure users can at least see the page and use the local storage option
      if (path === '/grocery-list') {
        console.log('[Middleware] Allowing access to grocery-list page');
        return NextResponse.next();
      }
      
      if (!hasAuthCookie) {
        console.log('[Middleware] No auth cookie found, redirecting to auth');
        
        // Add a redirect count parameter to detect and prevent redirect loops
        url.pathname = '/auth';
        url.searchParams.set('redirect', encodeURIComponent(path));
        url.searchParams.set('redirectCount', (redirectCount + 1).toString());
        
        return NextResponse.redirect(url);
      }
      
      // User is authenticated
      return NextResponse.next();
      
    } catch (error) {
      console.error('[Middleware] Auth check error:', error);
      // Allow access on error rather than blocking users
      return NextResponse.next();
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Execute this middleware on specific paths and their subpaths
    '/grocery-list',
    '/grocery-list/:path*',
    '/api/grocery-list/:path*',
    '/api/recipes/:path*',
    '/api/generate-recipe/:path*'
  ],
}; 