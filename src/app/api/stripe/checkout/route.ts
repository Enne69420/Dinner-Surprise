import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createCheckoutSession } from '@/lib/stripe';
import { checkEnvVars, getStripePriceIds } from '@/lib/env';

// Check environment variables at module load time
const envStatus = checkEnvVars();
if (!envStatus.success) {
  console.error('Checkout API: Missing required environment variables:', envStatus.missing);
}

export async function POST(request: NextRequest) {
  try {
    // Get authentication token from request header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.error('No Authorization header provided');
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Parse token from header (Bearer token)
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('Invalid Authorization header format');
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token format' },
        { status: 401 }
      );
    }

    // Setup Supabase with admin role to access auth user
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get user by token
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Error getting user from token:', userError);
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired token' },
        { status: 401 }
      );
    }
    
    // Get request body
    const { priceId, mode = 'subscription' } = await request.json();
    
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }
    
    // Validate that the price ID matches our expected IDs
    const stripePrices = getStripePriceIds();
    const validPriceIds = [
      stripePrices.premium.monthly,
      stripePrices.premium.yearly,
      stripePrices.family.monthly,
      stripePrices.family.yearly
    ];
    
    if (!validPriceIds.includes(priceId)) {
      console.warn(`Received unexpected price ID: ${priceId}. Expected one of: ${validPriceIds.join(', ')}`);
    }
    
    // Get user details from database
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single();
    
    console.log('Creating checkout session for user:', user.id, 'with price ID:', priceId);
    
    // Create checkout session
    const { sessionId, url } = await createCheckoutSession({
      priceId,
      userId: user.id,
      userEmail: profile?.email || user.email,
      mode: mode as 'subscription' | 'payment',
    });
    
    if (!url) {
      throw new Error('No checkout URL returned from Stripe');
    }
    
    return NextResponse.json({ sessionId, url });
  } catch (error: any) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
} 