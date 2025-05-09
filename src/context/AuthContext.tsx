'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import supabase from '@/utils/supabase';

// Define subscription plan types
export type SubscriptionPlan = 'free' | 'premium' | 'family';

// Add subscription plan interface
export interface UserSubscription {
  plan: SubscriptionPlan;
  plan_type?: SubscriptionPlan; // Also support the database column name
  isActive: boolean;
  status?: string; // Stripe subscription status
  subscription_id?: string;
  stripe_subscription_id?: string; // Add this for compatibility with database
  price_id?: string;
  current_period_end?: string;
  recipesRemaining: number; // For free users, tracks monthly usage
  savedRecipesLimit: number;
  expiresAt?: Date;
  stripe_customer_id?: string;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  subscription: UserSubscription;
  refreshSubscription: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any; data: any; emailConfirmationRequired: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
}

// Default subscription is free plan
const defaultSubscription: UserSubscription = {
  plan: 'free',
  isActive: true,
  recipesRemaining: 3,
  savedRecipesLimit: 5,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  subscription: defaultSubscription,
  refreshSubscription: async () => {},
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null, emailConfirmationRequired: false }),
  signOut: async () => {},
  resetPassword: async () => ({ error: null }),
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscription>(defaultSubscription);

  // Function to fetch user subscription data
  const fetchSubscription = async (userId: string) => {
    try {
      // Fetch subscription data from Supabase
      let { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      // Also fetch profile data to check for discrepancies
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('tier, monthly_usage')
        .eq('id', userId)
        .single();
        
      // Check for data discrepancy requiring sync
      let needsSync = false;
      
      // Case 1: Subscription exists but profile doesn't match
      if (!subscriptionError && subscriptionData && !profileError && profileData) {
        if (subscriptionData.plan_type !== profileData.tier) {
          console.log(`Detected mismatch: profile.tier=${profileData.tier}, subscription.plan_type=${subscriptionData.plan_type}`);
          needsSync = true;
        }
      }
      
      // Case 2: No subscription but profile exists
      if ((subscriptionError || !subscriptionData) && !profileError && profileData) {
        console.log('Subscription data missing but profile exists');
        needsSync = true;
      }
      
      // If we need to sync, call the sync API
      if (needsSync) {
        try {
          console.log('Syncing subscription data via API...');
          const response = await fetch('/api/user/sync-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId }),
          });
          
          if (response.ok) {
            console.log('Sync successful, fetching updated subscription data');
            
            // Fetch the updated subscription data
            const { data: updatedSubData, error: updatedSubError } = await supabase
              .from('user_subscriptions')
              .select('*')
              .eq('user_id', userId)
              .single();
              
            if (!updatedSubError && updatedSubData) {
              // Use the updated data
              subscriptionData = updatedSubData;
              subscriptionError = null;
            }
          } else {
            console.error('Error syncing subscription data:', await response.text());
          }
        } catch (syncError) {
          console.error('Error calling sync API:', syncError);
        }
      }
      
      // If subscription data exists and is valid, use it
      if (!subscriptionError && subscriptionData) {
        // Check active status and period end date
        let isActive = (
          subscriptionData.status === 'active' || 
          subscriptionData.status === 'trialing' ||
          subscriptionData.status === 'active_until_period_end'
        );
        
        // Check if there's a valid current_period_end date for canceled subscriptions
        let expiresAt: Date | undefined = undefined;
        if (subscriptionData.status === 'active_until_period_end' && subscriptionData.current_period_end) {
          expiresAt = new Date(subscriptionData.current_period_end);
          
          // If the current_period_end has passed, treat as inactive
          if (expiresAt < new Date()) {
            isActive = false;
          }
        }
        
        // Convert Supabase subscription data to our format
        const subscriptionObj: UserSubscription = {
          plan: subscriptionData.plan_type || 'free',
          plan_type: subscriptionData.plan_type,
          isActive: isActive,
          status: subscriptionData.status,
          subscription_id: subscriptionData.subscription_id,
          stripe_subscription_id: subscriptionData.stripe_subscription_id,
          price_id: subscriptionData.price_id,
          current_period_end: subscriptionData.current_period_end,
          recipesRemaining: subscriptionData.plan_type === 'premium' || subscriptionData.plan_type === 'family' ? Infinity : 3,
          savedRecipesLimit: subscriptionData.plan_type === 'premium' || subscriptionData.plan_type === 'family' ? 100 : 5,
          stripe_customer_id: subscriptionData.stripe_customer_id,
          expiresAt: expiresAt
        };
        
        setSubscription(subscriptionObj);
        return;
      }
      
      // If no subscription data or there was an error, use profile data as fallback
      if (!profileError && profileData) {
        // Use profile tier to determine subscription
        const tier = profileData.tier || 'free';
        const monthlyUsage = profileData.monthly_usage || 0;
        
        const profileSubscription: UserSubscription = {
          plan: tier as SubscriptionPlan,
          isActive: true,
          recipesRemaining: tier === 'premium' ? Infinity : Math.max(0, 3 - monthlyUsage),
          savedRecipesLimit: tier === 'premium' ? 100 : 5,
        };
        
        console.log('Using profile data for subscription:', profileSubscription);
        setSubscription(profileSubscription);
        return;
      }
      
      // If all else fails, use default subscription
      console.log('No subscription or profile data found, using default');
      setSubscription(defaultSubscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
      // Fall back to default subscription on error
      setSubscription(defaultSubscription);
    }
  };

  // Function to refresh subscription data
  const refreshSubscription = async () => {
    if (user) {
      await fetchSubscription(user.id);
    }
  };

  useEffect(() => {
    // Get current session and user
    const initAuth = async () => {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user || null);

        // Fetch subscription data if user is logged in
        if (session?.user) {
          await fetchSubscription(session.user.id);
        }

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            setSession(session);
            setUser(session?.user || null);
            
            // Update subscription when auth state changes
            if (session?.user) {
              await fetchSubscription(session.user.id);
            } else {
              // Reset to default subscription when logged out
              setSubscription(defaultSubscription);
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      // Make sure email verification is enabled
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || '',
          },
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?verified=true`,
        },
      });
      
      if (error) {
        console.error('Sign up error:', error);
        return { error, data: null, emailConfirmationRequired: false };
      }
      
      // Check if email confirmation is needed (confirmationSent flag)
      const needsEmailConfirmation = data?.user?.identities?.length === 0 || 
                                    !data?.user?.confirmed_at || 
                                    data?.user?.email_confirmed_at === null;
                                    
      console.log('Sign up successful, email confirmation needed:', needsEmailConfirmation);
      console.log('User data:', data?.user);
      
      return { 
        data, 
        error,
        emailConfirmationRequired: needsEmailConfirmation 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error, data: null, emailConfirmationRequired: false };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      return { error };
    } catch (error) {
      console.error('Reset password error:', error);
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    subscription,
    refreshSubscription,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext); 