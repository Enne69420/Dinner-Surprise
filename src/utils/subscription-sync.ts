import { createClient } from '@supabase/supabase-js';
import stripe from '@/lib/stripe';
import { Subscription, SubscriptionResponse, SubscriptionPlanType } from '@/types/subscription';
import type { Stripe } from 'stripe';

// Create an admin Supabase client for server-side operations
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

/**
 * Sync a subscription between Stripe and Supabase
 * @param userId The user ID
 * @param stripeSubscriptionId The Stripe subscription ID
 */
export async function syncSubscriptionWithStripe(userId: string, stripeSubscriptionId: string): Promise<SubscriptionResponse> {
  if (!stripe) {
    console.error('Stripe client not initialized');
    throw new Error('Stripe client not initialized');
  }
  
  // Get admin client
  const supabaseAdmin = getAdminClient();
  
  try {
    // Fetch the subscription from Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId) as any;
    
    if (!stripeSubscription) {
      throw new Error(`Subscription ${stripeSubscriptionId} not found in Stripe`);
    }
    
    // Extract plan details from price ID
    const subscriptionItem = stripeSubscription.items.data[0];
    const priceId = subscriptionItem?.price?.id;
    // Determine plan type based on price ID
    const planType = (priceId?.includes('premium') ? 'premium' : 'free') as SubscriptionPlanType;
    
    // Update user_subscriptions table
    const { error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        status: stripeSubscription.status,
        plan_type: planType,
        price_id: priceId,
        current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
      
    if (subError) {
      console.error('Error updating subscription in Supabase:', subError);
      throw subError;
    }
    
    // Also update the profiles table
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        tier: planType,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
      
    if (profileError) {
      console.error('Error updating profile tier:', profileError);
    }
    
    // Create our response object with the subscription data
    const subscription: Subscription = {
      id: stripeSubscription.id,
      user_id: userId,
      status: stripeSubscription.status,
      plan_type: planType,
      current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString()
    };
    
    return {
      success: true,
      subscription
    };
  } catch (error: any) {
    console.error('Error syncing subscription with Stripe:', error);
    
    // If the subscription can't be found in Stripe, update the database to reflect that
    if (error.code === 'resource_missing') {
      // Update subscription status to canceled in Supabase
      await supabaseAdmin
        .from('user_subscriptions')
        .update({
          status: 'canceled',
          plan_type: 'free',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
        
      // Update profile tier to free
      await supabaseAdmin
        .from('profiles')
        .update({
          tier: 'free',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      return {
        success: false,
        error: 'Subscription not found in Stripe, database updated to reflect cancellation',
        subscription: {
          id: stripeSubscriptionId,
          user_id: userId,
          status: 'canceled',
          plan_type: 'free',
          created_at: new Date().toISOString()
        }
      };
    }
    
    throw error;
  }
}

/**
 * Get subscription details from Stripe using the customer ID
 * @param stripeCustomerId Stripe customer ID
 */
export async function getStripeSubscriptionsForCustomer(stripeCustomerId: string) {
  if (!stripe) {
    console.error('Stripe client not initialized');
    throw new Error('Stripe client not initialized');
  }
  
  try {
    // List all subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: 'all',
      expand: ['data.default_payment_method']
    });
    
    return subscriptions.data;
  } catch (error) {
    console.error('Error fetching customer subscriptions from Stripe:', error);
    throw error;
  }
}

/**
 * Update subscription in both Stripe and Supabase
 */
export async function ensureSubscriptionsSynced(
  userId: string, 
  callback?: (result: SubscriptionResponse) => void
): Promise<SubscriptionResponse> {
  const supabaseAdmin = getAdminClient();
  
  try {
    // Get the user subscription from Supabase
    const { data: userSubscription, error: subError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (subError || !userSubscription) {
      console.error('Error or no subscription found:', subError);
      const result: SubscriptionResponse = { success: false, error: 'Subscription not found' };
      if (callback) callback(result);
      return result;
    }
    
    // If there's a Stripe subscription ID, sync with Stripe
    if (userSubscription.stripe_subscription_id && 
        !userSubscription.stripe_subscription_id.startsWith('manual_subscription_')) {
      try {
        const result = await syncSubscriptionWithStripe(
          userId,
          userSubscription.stripe_subscription_id
        );
        
        if (callback) callback(result);
        return result;
      } catch (syncError: any) {
        console.error('Error syncing subscription:', syncError);
        
        // If not found in Stripe, update local DB
        if (syncError.code === 'resource_missing') {
          await supabaseAdmin
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              plan_type: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId);
            
          // Update profile tier to free
          await supabaseAdmin
            .from('profiles')
            .update({
              tier: 'free',
              updated_at: new Date().toISOString()
            })
            .eq('id', userId);
            
          const result: SubscriptionResponse = { 
            success: false, 
            error: 'Subscription not found in Stripe, database updated' 
          };
          if (callback) callback(result);
          return result;
        }
        
        throw syncError;
      }
    } else if (userSubscription.subscription_id?.startsWith('manual_subscription_')) {
      // For manual subscriptions, just verify the local DB consistency
      // Make sure that profile.tier matches user_subscriptions.plan_type
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('tier')
        .eq('id', userId)
        .single();
        
      if (profile && profile.tier !== userSubscription.plan_type) {
        // Update profile tier to match subscription plan
        await supabaseAdmin
          .from('profiles')
          .update({
            tier: userSubscription.plan_type,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }
      
      const result: SubscriptionResponse = { 
        success: true, 
        message: 'Manual subscription verified' 
      };
      if (callback) callback(result);
      return result;
    }
    
    // Default response for cases without a subscription ID
    const result: SubscriptionResponse = { 
      success: true, 
      message: 'No subscription to sync' 
    };
    if (callback) callback(result);
    return result;
  } catch (error: any) {
    console.error('Error in ensureSubscriptionsSynced:', error);
    const result: SubscriptionResponse = { 
      success: false, 
      error: error.message 
    };
    if (callback) callback(result);
    throw error;
  }
} 