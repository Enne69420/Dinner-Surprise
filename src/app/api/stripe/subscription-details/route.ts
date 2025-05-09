import { NextRequest, NextResponse } from 'next/server';
import stripe, { getSubscription } from '@/lib/stripe';
import supabase from '@/utils/supabase';

// Add dynamic config to force dynamic rendering
export const dynamic = 'force-dynamic';

// Get fresh subscription details from Stripe - Changed to POST to avoid searchParams issue
export async function POST(request: NextRequest) {
  try {
    // Get subscription ID from request body instead of query params
    const { subscriptionId } = await request.json();
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }
    
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No authenticated user found in session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Verify Stripe instance is available
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly initialized' },
        { status: 500 }
      );
    }
    
    // Retrieve subscription details from Stripe
    try {
      const subscription = await getSubscription(subscriptionId);
      
      // Format the response
      return NextResponse.json({
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          price_id: subscription.items.data[0]?.price.id,
        }
      });
    } catch (stripeError) {
      console.error('Error retrieving subscription from Stripe:', stripeError);
      return NextResponse.json(
        { error: 'Failed to retrieve subscription from Stripe' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error getting subscription details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get subscription details' },
      { status: 500 }
    );
  }
} 