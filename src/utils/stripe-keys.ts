/**
 * This file provides fallback keys for development purposes only.
 * In production, these values should always come from environment variables.
 * 
 * DO NOT USE REAL LIVE KEYS HERE - THIS IS FOR DEVELOPMENT/DEBUGGING ONLY.
 */

// Determine if we're in a development environment
const isDev = process.env.NODE_ENV === 'development';

// Function to get the Stripe keys, either from environment or fallbacks
export const getStripeKeys = () => {
  // In development, show a message if env vars are missing
  if (isDev) {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️ No STRIPE_SECRET_KEY found in environment variables');
    }
    if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      console.warn('⚠️ No NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY found in environment variables');
    }
  }

  const stripeKeys = {
    // For production, always use the environment variables
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    
    // Debug flags to help identify where keys are coming from
    isUsingFallback: false,
    isUsingTest: false,
  };

  // In development, if keys are missing, add fallback testing keys
  if (isDev && (!stripeKeys.secretKey || !stripeKeys.publishableKey)) {
    console.log('Using fallback Stripe keys for development');
    
    // These should be Stripe test keys for development only
    const fallbackKeys = {
      secretKey: process.env.STRIPE_SECRET_KEY || '', // fallback would go here if needed
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '', // fallback would go here if needed
    };
    
    // Only use fallbacks if the real ones are missing
    stripeKeys.secretKey = stripeKeys.secretKey || fallbackKeys.secretKey;
    stripeKeys.publishableKey = stripeKeys.publishableKey || fallbackKeys.publishableKey;
    stripeKeys.isUsingFallback = true;
  }

  // Check if using test keys
  stripeKeys.isUsingTest = stripeKeys.secretKey.startsWith('sk_test_');

  return stripeKeys;
};

export default getStripeKeys; 