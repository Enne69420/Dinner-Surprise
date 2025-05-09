import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe on client side
const getStripePromise = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  
  if (!key) {
    console.error('Missing Stripe publishable key');
    return null;
  }
  
  // For Stripe.js v7, the options parameter is required
  return loadStripe(key, {
    locale: 'auto',
  });
};

export default getStripePromise; 