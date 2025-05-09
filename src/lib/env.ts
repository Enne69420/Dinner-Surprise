/**
 * Environment Variable Utility
 * 
 * This file provides helper functions to safely access environment variables
 * and provides fallbacks for development.
 */

/**
 * Gets the Stripe publishable key from environment variables
 */
export function getStripePublishableKey(): string {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    console.error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
    return '';
  }
  return key;
}

/**
 * Gets the Stripe secret key from environment variables
 */
export function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    console.error('STRIPE_SECRET_KEY is not set');
    return '';
  }
  return key;
}

/**
 * Gets the base URL from environment variables or defaults to localhost
 */
export function getBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_BASE_URL || 
    (typeof window !== 'undefined' && window.location.origin 
      ? window.location.origin 
      : 'http://localhost:3000');
  
  return url;
}

/**
 * Gets the Stripe price IDs from environment variables
 */
export function getStripePriceIds() {
  return {
    premium: {
      monthly: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY || '',
      yearly: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY || '',
    },
    family: {
      monthly: process.env.NEXT_PUBLIC_PRICE_ID_FAMILY_MONTHLY || '',
      yearly: process.env.NEXT_PUBLIC_PRICE_ID_FAMILY_YEARLY || '',
    }
  };
}

/**
 * Check if required environment variables are set
 */
export function checkEnvVars() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'STRIPE_SECRET_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    return { success: false, missing };
  }

  const stripePrices = [
    'NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY',
    'NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY'
  ];
  
  const missingPrices = stripePrices.filter(key => !process.env[key]);
  
  if (missingPrices.length > 0) {
    console.warn(`Missing Stripe price IDs: ${missingPrices.join(', ')}`);
  }
  
  return { success: true };
} 