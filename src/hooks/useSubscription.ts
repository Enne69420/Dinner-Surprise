import { useState, useEffect } from 'react';
import supabase from '@/utils/supabase';

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string;
  subscription_id?: string;
  subscription_status: string;
  plan_type?: string;
  price_id?: string;
  current_period_end?: string;
  created_at: string;
  updated_at?: string;
}

export const useSubscription = (userId: string | undefined) => {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [isStripeDataFetched, setIsStripeDataFetched] = useState(false);

  // Check if user has an active subscription
  const isSubscribed = (): boolean => {
    if (!subscription) return false;
    
    const validStatuses = ['active', 'trialing'];
    return validStatuses.includes(subscription.subscription_status);
  };

  // Check if subscription is valid (active or in grace period)
  const isSubscriptionValid = (): boolean => {
    if (!subscription) return false;
    
    const validStatuses = ['active', 'trialing', 'past_due'];
    return validStatuses.includes(subscription.subscription_status);
  };

  // Check if subscription has premium plan
  const hasPremium = (): boolean => {
    if (!subscription) return false;
    if (!isSubscriptionValid()) return false;

    // Check if plan type is premium
    if (subscription.plan_type === 'premium') return true;
    
    // Check if price_id matches any premium price IDs
    const premiumMonthly = process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY;
    const premiumYearly = process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY;
    
    return subscription.price_id ? [premiumMonthly, premiumYearly].includes(subscription.price_id) : false;
  };

  // Get current period end date
  const getCurrentPeriodEnd = (): Date | null => {
    if (!subscription || !subscription.current_period_end) return null;
    return new Date(subscription.current_period_end);
  };

  // Get plan type
  const getPlanType = (): string => {
    if (!subscription) return 'free';
    if (subscription.plan_type) return subscription.plan_type;
    
    // If plan_type is not available but we have a valid premium subscription
    if (isSubscriptionValid() && hasPremium()) {
      return 'premium';
    }
    
    return 'free';
  };

  // Sync subscription with Stripe
  const syncSubscriptionWithStripe = async (): Promise<void> => {
    if (!userId) return;
    
    try {
      const response = await fetch('/api/user/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync subscription');
      }
      
      // After syncing, fetch the updated subscription data
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
        
      if (error) {
        console.error('Error fetching subscription after sync:', error);
      } else {
        setSubscription(data);
        setIsStripeDataFetched(true);
      }
    } catch (err) {
      console.error('Error syncing subscription with Stripe:', err);
    }
  };

  // Fetch subscription data
  useEffect(() => {
    const fetchSubscription = async () => {
      if (!userId) {
        setLoading(false);
        setSubscription(null);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error: fetchError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        if (fetchError) {
          console.log('Error fetching subscription, checking profiles table');
          // No subscription found, check profile tier as fallback
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('tier')
            .eq('id', userId)
            .single();
            
          if (!profileError && profile && profile.tier) {
            // Create a minimal subscription object based on profile tier
            setSubscription({
              id: userId,
              user_id: userId,
              stripe_customer_id: '',
              subscription_status: profile.tier === 'premium' ? 'active' : 'inactive',
              plan_type: profile.tier,
              created_at: new Date().toISOString()
            });
            setError(null);
          } else {
            console.error('Error fetching profile tier:', profileError);
            setError(fetchError);
            setSubscription(null);
          }
        } else {
          // We have subscription data from the database
          const subscriptionData = data as Subscription;
          
          // If this is a real Stripe subscription (not manual), try to get fresh details from Stripe
          if (subscriptionData.stripe_subscription_id && 
              !subscriptionData.stripe_subscription_id.startsWith('manual_subscription_')) {
            try {
              // Call API to get fresh subscription details from Stripe using POST
              const response = await fetch(`/api/stripe/subscription-details`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  subscriptionId: subscriptionData.stripe_subscription_id
                }),
              });
              
              if (response.ok) {
                const stripeData = await response.json();
                
                // Update the subscription data with fresh info from Stripe
                if (stripeData.subscription) {
                  // Merge database data with fresh Stripe data
                  subscriptionData.current_period_end = stripeData.subscription.current_period_end;
                  subscriptionData.subscription_status = stripeData.subscription.status;
                  setIsStripeDataFetched(true);
                }
              }
            } catch (err) {
              // Just log the error but continue with database data
              console.error('Failed to fetch fresh subscription data from Stripe:', err);
            }
          }
          
          setSubscription(subscriptionData);
          setError(null);
          
          // After initial load, sync with Stripe for premium users with Stripe subscriptions
          if (subscriptionData.plan_type === 'premium' && 
              subscriptionData.stripe_subscription_id && 
              !subscriptionData.stripe_subscription_id.startsWith('manual_subscription_') && 
              !isStripeDataFetched) {
            // Sync in the background without blocking the UI
            setTimeout(() => syncSubscriptionWithStripe(), 100);
          }
        }
      } catch (err: any) {
        console.error('Subscription fetch failed:', err);
        setError(err);
        setSubscription(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
    
    // Set up real-time subscription to get updates
    const channel = supabase
      .channel(`subscription-${userId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_subscriptions',
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        setSubscription(payload.new as Subscription);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isStripeDataFetched]);

  return {
    subscription,
    loading,
    error,
    isSubscribed,
    isSubscriptionValid,
    hasPremium,
    getCurrentPeriodEnd,
    getPlanType,
    syncSubscriptionWithStripe
  };
}; 