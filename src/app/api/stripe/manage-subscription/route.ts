import { NextRequest, NextResponse } from 'next/server';
import stripe, { cancelSubscription } from '@/lib/stripe';
import supabase from '@/utils/supabase';

// Get subscription details and generate portal session
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No authenticated user found in session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = session.user;
    
    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    
    // Check if we have a customer ID
    if (!subscription.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found for this subscription' },
        { status: 400 }
      );
    }
    
    // Create Stripe customer portal session
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly initialized' },
        { status: 500 }
      );
    }
    
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/account`,
    });
    
    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Portal session error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create portal session' },
      { status: 500 }
    );
  }
}

// Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.error('No authenticated user found in session');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const user = session.user;
    
    // Get user's subscription
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!subscription) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }
    
    // Check which subscription ID to use
    const subscriptionId = subscription.stripe_subscription_id || subscription.subscription_id;
    
    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'No subscription ID found' },
        { status: 400 }
      );
    }
    
    // Cancel the subscription in Stripe
    const result = await cancelSubscription(subscriptionId);
    
    // Update the subscription status in the database
    await supabase
      .from('user_subscriptions')
      .update({
        subscription_status: 'canceled',
        plan_type: 'free',
        current_period_end: new Date(result.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
      
    // Also update the user's profile tier to free
    await supabase
      .from('profiles')
      .update({
        tier: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);
    
    return NextResponse.json({ success: true, canceled_at: result.canceled_at });
  } catch (error: any) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 