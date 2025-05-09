import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Changed from GET to POST to avoid searchParams issue
export async function POST(request: NextRequest) {
  try {
    console.log('Stripe client initialized successfully');
    
    // Verify Stripe instance is available
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not properly initialized' },
        { status: 500 }
      );
    }
    
    // Get session ID from request body instead of query params
    const { sessionId } = await request.json();
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is missing' },
        { status: 400 }
      );
    }
    
    // Create Supabase admin client with service role key
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
    
    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 400 }
      );
    }
    
    // Extract customer ID from metadata
    const userId = session.metadata?.userId;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID not found in session metadata' },
        { status: 400 }
      );
    }
    
    // Extract subscription details
    const subscription = session.subscription;
    const customer = session.customer;
    
    if (!subscription || typeof subscription === 'string') {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer data not found' },
        { status: 400 }
      );
    }
    
    console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 10) + '...');
    console.log('Updating subscription for user', userId, 'with status', subscription.status);
    
    // Extract full plan details from the subscription item
    const subscriptionItem = subscription.items.data[0];
    const priceId = subscriptionItem?.price?.id;
    
    // First try to get plan_type directly from the session metadata
    // This is the most reliable source as it's set when creating the checkout
    let planType = session.metadata?.planType || 'free';
    
    // If planType wasn't in metadata, do our standard detection
    if (planType === 'free' && priceId) {
      // Convert to lowercase for case-insensitive comparison
      const priceIdLower = priceId.toLowerCase();
      if (priceIdLower.includes('premium')) {
        planType = 'premium';
      } else if (priceIdLower.includes('family')) {
        planType = 'family';
      } else {
        // Check against environment variables as fallback
        const premiumMonthly = process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY;
        const premiumYearly = process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY;
        const familyMonthly = process.env.NEXT_PUBLIC_PRICE_ID_FAMILY_MONTHLY;
        const familyYearly = process.env.NEXT_PUBLIC_PRICE_ID_FAMILY_YEARLY;
        
        if (priceId === premiumMonthly || priceId === premiumYearly) {
          planType = 'premium';
        } else if (priceId === familyMonthly || priceId === familyYearly) {
          planType = 'family';
        }
      }
    }
    
    console.log(`Determined plan_type: ${planType} from metadata=${session.metadata?.planType}, priceId=${priceId}`);
    
    // Update user_subscriptions table with complete Stripe data
    const { data: existingSubscription, error: subscriptionCheckError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (subscriptionCheckError) {
      console.error('Error checking existing subscription:', subscriptionCheckError);
    }
    
    let subscriptionResult;
    
    try {
      // Get the customer ID string safely
      const customerIdString = typeof customer === 'string' ? customer : customer.id;
      
      if (existingSubscription) {
        // Update existing subscription record
        const { data, error } = await supabaseAdmin
          .from('user_subscriptions')
          .update({
            plan_type: planType,
            status: subscription.status,
            stripe_subscription_id: subscription.id,
            subscription_id: subscription.id, // Ensure both IDs are set
            stripe_customer_id: customerIdString,
            price_id: priceId,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();
          
        if (error) {
          console.error('Error updating user_subscriptions:', error);
          throw error;
        }
        
        subscriptionResult = data;
      } else {
        // Create new subscription record
        const { data, error } = await supabaseAdmin
          .from('user_subscriptions')
          .insert({
            user_id: userId,
            plan_type: planType,
            status: subscription.status,
            stripe_subscription_id: subscription.id,
            subscription_id: subscription.id, // Ensure both IDs are set
            stripe_customer_id: customerIdString,
            price_id: priceId,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) {
          console.error('Error creating user_subscriptions:', error);
          throw error;
        }
        
        subscriptionResult = data;
      }
      
      // Always update the profiles table to maintain consistency
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .update({
          tier: planType,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      if (profileError) {
        console.error('Error updating profile tier:', profileError);
      } else {
        console.log(`Successfully updated profile tier to ${planType} for user ${userId}`);
      }
      
      return NextResponse.json({
        success: true,
        subscription: subscriptionResult
      });
    } catch (error: any) {
      console.error('Error in stripe verify-payment:', error);
      return NextResponse.json(
        { error: 'Database update failed: ' + error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in verify-payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
} 