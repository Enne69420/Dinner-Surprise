import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    console.log('Stripe client initialized successfully');
    const body = await request.json();
    const { subscriptionId, userId } = body;
    
    if (!subscriptionId || !userId) {
      return NextResponse.json(
        { error: 'Subscription ID and User ID are required' },
        { status: 400 }
      );
    }
    
    // Create a server-side admin client to update the database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Handle manual subscriptions (non-Stripe)
    if (subscriptionId.startsWith('manual_subscription_')) {
      console.log('Manual subscription detected, updating database directly without Stripe call');
      
      // For manual subscriptions, set status to inactive and plan to free
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'inactive',
          plan_type: 'free',
          // Keep subscription IDs for record keeping
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      // Also update the profiles table
      await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'free',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      return NextResponse.json({
        success: true,
        message: 'Manual subscription successfully canceled',
        subscription: {
          id: subscriptionId,
          status: 'inactive',
          cancel_at_period_end: false
        }
      });
    }
    
    // Check if Stripe is initialized
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly initialized' },
        { status: 500 }
      );
    }
    
    // Get the Stripe customer ID first
    const { data: subscription } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();
    
    // If there's a Stripe customer ID, use the customer portal
    if (subscription?.stripe_customer_id) {
      try {
        // Create a customer portal session instead of direct cancellation
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
          return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/profile?tab=subscription`,
        });
        
        return NextResponse.json({
          success: true,
          redirectToStripe: true,
          url: portalSession.url,
          message: 'Redirecting to Stripe Customer Portal'
        });
      } catch (portalError: any) {
        console.error('Error creating portal session:', portalError);
        // Continue with direct cancellation if portal fails
      }
    }
    
    // Fallback to direct subscription cancellation if portal fails or no customer ID
    let canceledSubscription: Stripe.Subscription;
    try {
      // For real Stripe subscriptions, cancel at period end instead of immediately
      canceledSubscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      }) as Stripe.Subscription;
      console.log('Successfully scheduled Stripe subscription cancellation at period end:', subscriptionId);
    } catch (stripeError: any) {
      console.error('Error canceling subscription:', stripeError);
      
      // If subscription can't be found in Stripe, update DB only
      if (stripeError.code === 'resource_missing') {
        console.log('Subscription not found in Stripe, updating database only');
        
        await supabaseAdmin
          .from('user_subscriptions')
          .update({
            status: 'canceled',
            plan_type: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
          
        // Also update profiles table
        await supabaseAdmin
          .from('profiles')
          .update({
            tier: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
          
        return NextResponse.json({
          success: true,
          message: 'Subscription marked as canceled in database',
          error: 'Subscription not found in Stripe'
        });
      }
      
      return NextResponse.json(
        { error: `Stripe error: ${stripeError.message}` },
        { status: 500 }
      );
    }
    
    // Use a type guard to ensure canceledSubscription has the expected properties
    if (!canceledSubscription || typeof canceledSubscription.current_period_end !== 'number') {
      throw new Error('Invalid subscription data from Stripe');
    }
    
    // Update subscription status in database to reflect cancel at period end
    await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: 'active_until_period_end',
        plan_type: canceledSubscription.cancel_at_period_end ? 'premium' : 'free', // Keep as premium until period end
        current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    
    // Do NOT update the profiles table yet - keep as premium until period end
    
    return NextResponse.json({
      success: true,
      message: 'Subscription has been scheduled to cancel at the end of the billing period',
      subscription: {
        id: canceledSubscription.id,
        status: 'active_until_period_end',
        current_period_end: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: canceledSubscription.cancel_at_period_end
      }
    });
  } catch (error: any) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
} 