import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { Readable } from 'stream';
import { updateUserSubscriptionStatus } from '@/utils/transaction';

// Configure the API route with the new route segment config format
export const dynamic = 'force-dynamic';
export const preferredRegion = 'auto';
export const runtime = 'nodejs';

// Helper to read the request body as raw buffer
async function buffer(readable: Readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

// Create an admin Supabase client
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: 'Internal error: Stripe not initialized' }, { status: 500 });
    }
    
    const buf = await buffer(request.body as unknown as Readable);
    const sig = request.headers.get('stripe-signature');
    
    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }
    
    let event;
    
    // Verify the webhook signature
    try {
      event = stripe.webhooks.constructEvent(
        buf, 
        sig, 
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }
    
    // Get Supabase admin client
    const supabaseAdmin = getAdminClient();
    
    // Handle the event based on type
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.resumed': {
        const subscription = event.data.object;
        
        // Find the user_id by looking up the customer ID
        const { data: userData, error: userError } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .maybeSingle();
          
        if (userError || !userData) {
          break;
        }
          
        // Extract subscription price details and metadata
        const price = subscription.items.data[0]?.price;
        const priceId = price?.id;
        const metadata = subscription.metadata || {}; 
        
        // First check if planType is directly in the metadata
        let planType = metadata.planType || 'free';
        
        // If not, determine plan type from product
        if (planType === 'free' && price?.product) {
          // Try to get plan type from the product metadata or default to 'premium'
          try {
            const product = await stripe.products.retrieve(price.product as string);
            planType = product.metadata?.planType || 'premium';
          } catch (productError) {
            // Default to premium if we can't determine the plan type
            planType = 'premium';
          }
        }
        
        // Check if this is a subscription that's being canceled at period end
        let status = subscription.status;
        if (subscription.cancel_at_period_end) {
          // Since 'active_until_period_end' isn't a valid Stripe status, use 'active' but track it differently
          status = 'active'; // Keep using the Stripe status
          
          // Set the database status in a way that our app recognizes
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'active_until_period_end', // Custom status for our app
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);
        }
        
        // Update both the subscription and profile tables directly for consistency
        try {
          // Update subscription record
          await updateUserSubscriptionStatus(userData.user_id, planType, {
            status: status,
            stripe_subscription_id: subscription.id,
            subscription_id: subscription.id,
            price_id: priceId,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          });
          
          // Directly update the profile table as well to ensure consistency
          await supabaseAdmin
            .from('profiles')
            .update({
              tier: planType,
              updated_at: new Date().toISOString()
            })
            .eq('id', userData.user_id);
        } catch (error) {
          // Silently handle error
        }
        
        break;
      }
      
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused': {
        const subscription = event.data.object;
        
        // Find the user_id
        const { data: userData, error: userError } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', subscription.customer)
          .maybeSingle();
          
        if (userError || !userData) {
          break;
        }
        
        // For deleted or paused subscriptions, downgrade to free plan
        await updateUserSubscriptionStatus(userData.user_id, 'free', {
          status: event.type === 'customer.subscription.paused' ? 'paused' : 'canceled',
          // Keep the subscription IDs for historical reference
          stripe_subscription_id: subscription.id,
          subscription_id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
        });
        
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Find the user by subscription ID
          const { data: userData, error: userError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .maybeSingle();
            
          if (userError || !userData) {
            break;
          }
          
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // Update the current_period_end in your database
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'active', // Ensure status is active after successful payment
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        
        // Only process subscription invoices
        if (invoice.subscription) {
          // Find the user by subscription ID
          const { data: userData, error: userError } = await supabaseAdmin
            .from('user_subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription)
            .maybeSingle();
            
          if (userError || !userData) {
            break;
          }
          
          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          
          // Update the status in your database to reflect the past_due state
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: subscription.status, // This will typically be 'past_due'
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);
        }
        break;
      }
      
      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        
        // Find the user_id
        const { data: userData, error: userError } = await supabaseAdmin
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .maybeSingle();
          
        if (userError || !userData) {
          break;
        }
        
        // Update trial end information if trial_end exists
        if (subscription.trial_end) {
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              trial_end: new Date(subscription.trial_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userData.user_id);
        }
        break;
      }
    }
    
    return NextResponse.json({ received: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
} 