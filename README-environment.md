# Environment Variables Guide

This guide explains the environment variables required for running the Dinner Surprise application.

## Setup Instructions

1. Copy `sample.env.local` to `.env.local`
2. Fill in all required variables with your actual values
3. Restart the application to apply changes

## Required Variables

### Supabase Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://abcdefghijklm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/public key for client-side calls | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key for admin-level operations | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Stripe Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `STRIPE_SECRET_KEY` | Stripe secret key for server-side operations | `sk_test_51AbCdEfGhIjKlMnO...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client-side | `pk_test_51AbCdEfGhIjKlMnO...` |
| `STRIPE_WEBHOOK_SECRET` | Secret for validating Stripe webhook events | `whsec_abcDEFghiJKLmnoPQRst...` |

### Stripe Price IDs

| Variable | Description | How to obtain |
|----------|-------------|---------------|
| `NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY` | Monthly premium subscription price ID | From Stripe Dashboard → Products |
| `NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY` | Yearly premium subscription price ID | From Stripe Dashboard → Products |
| `NEXT_PUBLIC_PRICE_ID_FAMILY_MONTHLY` | Monthly family subscription price ID | From Stripe Dashboard → Products |
| `NEXT_PUBLIC_PRICE_ID_FAMILY_YEARLY` | Yearly family subscription price ID | From Stripe Dashboard → Products |

### Application Configuration

| Variable | Description | Default for local development |
|----------|-------------|------------------------------|
| `NEXT_PUBLIC_BASE_URL` | Base URL for the application | `http://localhost:3000` |

### AI Features Configuration

| Variable | Description | Required? |
|----------|-------------|-----------|
| `OPENAI_API_KEY` | OpenAI API key for AI-powered features | Yes, if using AI recipe generation |

## Troubleshooting

### Stripe Integration Issues

If you encounter issues with Stripe:

1. Check that your Stripe keys are correctly formatted and belong to the same account
2. Ensure you're using the correct mode (test/live) keys consistently
3. Verify your price IDs exist in the Stripe dashboard
4. Test the Stripe configuration with the debug endpoint: `/api/debug/stripe`

### Supabase Connection Issues

If you have trouble connecting to Supabase:

1. Verify your project is active in the Supabase dashboard
2. Check that you're using the correct project URL and API keys
3. Ensure your Supabase service role key has the necessary permissions
4. Check network connectivity from your development environment

## Security Notes

- Never commit `.env.local` to version control
- Rotate keys if you suspect they've been compromised
- Keep your service role key secure; it has admin access to your database 