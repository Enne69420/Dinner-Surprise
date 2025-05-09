# Subscription Synchronization System

## Overview

The Dinner Surprise app maintains subscription information in two tables:
- `profiles`: Contains user profile information including a `tier` field ("free", "premium", etc.)
- `user_subscriptions`: Contains detailed subscription information including payment status, plan type, etc.

These tables must stay synchronized for proper functionality. This document explains how the synchronization system works.

## Database Schema

### user_subscriptions Table
```sql
create table public.user_subscriptions (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  plan_type text null default 'free'::text,
  subscription_id text null,
  price_id text null,
  status text null default 'inactive'::text,
  stripe_customer_id text null,
  current_period_end timestamp with time zone null,
  created_at timestamp with time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp with time zone null default CURRENT_TIMESTAMP,
  stripe_subscription_id text null,
  constraint user_subscriptions_pkey primary key (id),
  constraint unique_user_subscription unique (user_id),
  constraint user_subscriptions_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);
```

### Key Fields to Maintain
- `profiles.tier` should match `user_subscriptions.plan_type`
- Both `subscription_id` and `stripe_subscription_id` should be populated (they are the same value)
- `status` should reflect current subscription status ("active", "inactive", "active_until_period_end")

## Synchronization Mechanisms

### 1. Automatic Synchronization
The application automatically ensures tables are synchronized through:

- **AuthContext Provider**: When fetching user data, it checks for discrepancies between the tables and calls the sync API endpoint when needed.

- **Stripe Webhook Handler**: When processing Stripe events, both tables are updated together.

- **Subscription Management Endpoints**: All API endpoints that modify subscriptions update both tables consistently.

### 2. Manual Sync API Endpoint

The `/api/user/sync-subscription` endpoint can be called to force synchronization:

- Compares data in both tables
- Uses premium status as the "source of truth" when there's a conflict
- Updates all relevant fields in both tables
- Ensures subscription IDs are populated in both fields

## Database Migration Script

The `fix-subscription-sync.sql` script:

- Ensures all required columns exist with proper defaults
- Sets NOT NULL constraints and adds missing indexes
- Cleans up any inconsistencies between tables
- Creates triggers for automatic timestamp updates
- Populates missing values in either table
- Ensures subscription IDs are duplicated in both fields

## Usage

- **Automatic synchronization** happens during normal usage
- **SQL Migration** should be run after deployment to fix existing data
- **Manual synchronization** is automatically triggered when needed

## Troubleshooting

If subscription status issues persist:

1. Run the included SQL migration script
2. Ensure Stripe webhook events are properly configured
3. Check for logging messages in the application logs
4. Manually trigger sync by calling the API endpoint 