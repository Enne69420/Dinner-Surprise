/**
 * Subscription types for use across the application
 */

// Define subscription plan types
export type SubscriptionPlanType = 'free' | 'premium' | 'family';

// Database subscription record structure
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_id?: string;
  status?: string;
  plan_type?: SubscriptionPlanType;
  price_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at?: string;
}

// Response from subscription sync endpoint
export interface SubscriptionResponse {
  success: boolean;
  error?: string;
  message?: string;
  subscription?: Subscription;
}

// For use in the Auth context
export interface UserSubscription {
  plan: SubscriptionPlanType;
  plan_type?: SubscriptionPlanType; // Also support the database column name
  isActive: boolean;
  status?: string; // Stripe subscription status
  subscription_id?: string;
  stripe_subscription_id?: string;
  price_id?: string;
  current_period_end?: string;
  current_period_start?: string;
  recipesRemaining: number; // For free users, tracks monthly usage
  savedRecipesLimit: number;
  expiresAt?: Date;
  stripe_customer_id?: string;
} 