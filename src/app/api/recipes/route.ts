import { NextRequest, NextResponse } from 'next/server';

/**
 * API endpoint for handling recipe operations
 * This is a central route that redirects to the appropriate specialized endpoint
 */
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const requestUrl = new URL(req.url);
    console.log('Received request to /api/recipes - will forward to /api/recipes/save');
    
    // Clone the request body for forwarding
    const body = await req.json();
    
    // Create a new URL for the save endpoint
    const saveUrl = new URL('/api/recipes/save', requestUrl.origin);
    
    // Forward the request to the save endpoint
    const response = await fetch(saveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });
    
    // Return the response from the save endpoint
    const data = await response.json();
    console.log('Response from save endpoint:', response.status, response.statusText);
    return NextResponse.json(data, { status: response.status });
    
  } catch (error: any) {
    console.error('Error in recipes API:', error);
    return NextResponse.json(
      { error: 'Failed to process recipe request: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 