import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import supabase from '@/utils/supabase';
import { getStripePriceIds } from '@/lib/env';

// Stripe webhook handler
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = headers().get('stripe-signature') || '';

  let event: Stripe.Event;

  try {
    if (!stripe) {
      throw new Error('Stripe is not properly initialized');
    }
    
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (!session?.metadata?.userId) {
          throw new Error('Missing userId in session metadata');
        }

        // Verify that payment is successful
        if (session.payment_status === 'paid') {
          const userId = session.metadata.userId;
          
          // Update the user's subscription status in database
          if (session.mode === 'subscription' && session.subscription) {
            // Retrieve subscription details
            if (!stripe) {
              throw new Error('Stripe is not properly initialized');
            }
            
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            );
            
            // Determine the plan type based on price ID
            let planType = 'premium'; // Default to premium
            
            // Get price IDs from environment variables
            const stripePrices = getStripePriceIds();
            const premiumMonthlyId = stripePrices.premium.monthly;
            const premiumYearlyId = stripePrices.premium.yearly;
            
            // Set plan type based on price ID
            const priceId = subscription.items.data[0].price.id;
            if (priceId === premiumMonthlyId || priceId === premiumYearlyId) {
              planType = 'premium';
            }
            
            console.log(`Updating subscription for user ${userId} to ${planType} plan with price ID ${priceId}`);
            
            // Update user profile in database
            await supabase
              .from('user_subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: session.customer as string,
                stripe_subscription_id: subscription.id,
                subscription_id: subscription.id, // Use same ID for both fields
                status: subscription.status,
                plan_type: planType,
                price_id: priceId,
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString()
              });
              
            // Also update the user's profile tier
            await supabase
              .from('profiles')
              .update({
                tier: planType,
                updated_at: new Date().toISOString()
              })
              .eq('id', userId);
          }
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Extract customer ID from subscription
        const customerId = subscription.customer as string;
        
        // Find user with this customer ID
        const { data: userSubscription } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (userSubscription) {
          // Determine the plan type based on price ID
          let planType = 'premium'; // Default to premium
          
          // Get price IDs from environment variables
          const stripePrices = getStripePriceIds();
          const premiumMonthlyId = stripePrices.premium.monthly;
          const premiumYearlyId = stripePrices.premium.yearly;
          
          // Set plan type based on price ID
          const priceId = subscription.items.data[0].price.id;
          if (priceId === premiumMonthlyId || priceId === premiumYearlyId) {
            planType = 'premium';
          }
          
          // Check if the subscription has been canceled but is still active
          const status = subscription.cancel_at_period_end 
            ? 'active_until_period_end' 
            : subscription.status;
          
          // Update subscription info
          await supabase
            .from('user_subscriptions')
            .update({
              status: status,
              plan_type: planType,
              price_id: priceId,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userSubscription.user_id);
            
          // Also update the user's profile tier
          await supabase
            .from('profiles')
            .update({
              tier: planType,
              updated_at: new Date().toISOString()
            })
            .eq('id', userSubscription.user_id);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Extract customer ID from subscription
        const customerId = subscription.customer as string;
        
        // Find user with this customer ID
        const { data: userSubscription } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (userSubscription) {
          // Update subscription status to cancelled
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              plan_type: 'free',
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userSubscription.user_id);
            
          // Update the user's profile tier back to free
          await supabase
            .from('profiles')
            .update({
              tier: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', userSubscription.user_id);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        
        // Find user with this customer ID
        const { data: userSubscription } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (userSubscription) {
          // Update subscription status
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userSubscription.user_id);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error(`Webhook error: ${error.message}`);
    return NextResponse.json(
      { error: error.message || 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 