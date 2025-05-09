import Stripe from 'stripe';
import { getStripeSecretKey, getBaseUrl } from './env';

// Initialize Stripe with error handling
let stripeInstance: Stripe | null = null;

try {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  
  if (!apiKey) {
    console.error('STRIPE_SECRET_KEY is not set in environment variables');
  } else {
    stripeInstance = new Stripe(apiKey, {
      apiVersion: '2023-10-16', // Use a specific API version
      appInfo: {
        name: 'Dinner Surprise',
        version: '1.0.0',
      },
      typescript: true,
    });
    
    console.log('Stripe client initialized successfully');
  }
} catch (error) {
  console.error('Error initializing Stripe client:', error);
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession({
  priceId,
  userId,
  userEmail,
  mode = 'subscription',
}: {
  priceId: string;
  userId: string;
  userEmail?: string;
  mode?: 'subscription' | 'payment';
}) {
  if (!stripeInstance) {
    throw new Error('Stripe is not initialized');
  }

  if (!priceId || !userId) {
    throw new Error('Price ID and User ID are required');
  }

  // Get the base URL, making sure it's a valid URL
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new Error('Not a valid URL - Base URL is missing');
  }

  try {
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      billing_address_collection: 'auto',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscribe?canceled=true`,
      metadata: {
        userId,
      },
      customer_email: userEmail,
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string) {
  if (!stripeInstance) {
    console.error('Stripe client not initialized');
    throw new Error('Payment processing is unavailable');
  }
  
  try {
    return await stripeInstance.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    throw error;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  if (!stripeInstance) {
    console.error('Stripe client not initialized');
    throw new Error('Payment processing is unavailable');
  }
  
  try {
    return await stripeInstance.subscriptions.cancel(subscriptionId);
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Get all products and prices
 */
export async function getProductsAndPrices() {
  if (!stripeInstance) {
    console.error('Stripe client not initialized');
    throw new Error('Payment processing is unavailable');
  }
  
  try {
    const products = await stripeInstance.products.list({
      active: true,
      expand: ['data.default_price'],
    });

    const prices = await stripeInstance.prices.list({
      active: true,
    });

    return { products, prices };
  } catch (error) {
    console.error('Error getting products and prices:', error);
    throw error;
  }
}

// Export the Stripe instance
export default stripeInstance; 