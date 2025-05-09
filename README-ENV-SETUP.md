# Environment Variable Setup

This document provides instructions for setting up the necessary environment variables for the Dinner Surprise application to work properly with Stripe.

## Required Variables

Create a `.env.local` file in the project root with the following variables:

```
# Stripe API Keys - Get these from your Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Stripe Price IDs - Get these from your Stripe Dashboard after creating products
NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY=price_your_premium_monthly_id
NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY=price_your_premium_yearly_id
```

## Where to Find Your Stripe Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to Developers > API keys
3. Copy your publishable key and secret key
   - Use test keys for development (`pk_test_` and `sk_test_`)
   - Use live keys for production (`pk_live_` and `sk_live_`)

## Where to Find Your Stripe Price IDs

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Go to Products
3. Create products with the following configurations:
   - Premium Monthly: Create a product with monthly recurring billing
   - Premium Yearly: Create a product with yearly recurring billing
4. After creating each product, copy the "Price ID" (starts with `price_`)

## Troubleshooting

If you're having issues with environment variables not loading:

1. Make sure your `.env.local` file is in the project root
2. Restart your development server after making changes
3. Check that your environment variables are properly formatted (no spaces around `=`)
4. Verify that the variables have the exact names listed above

## Verifying Environment Variables

When the application starts, it will log the status of environment variables in the console.

```
================ ENVIRONMENT VARIABLES STATUS ================
STRIPE_SECRET_KEY: ✓ Set
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: ✓ Set
NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY: ✓ Set
NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY: ✓ Set
.env.local exists: ✓ Yes
============================================================
```

If you see `✗ Missing` for any variable, check your `.env.local` file and make sure the variable is set correctly. 