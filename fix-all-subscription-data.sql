-- Comprehensive fix for subscription data
-- This script ensures all required fields in user_subscriptions are properly populated

-- Ensure all required columns exist
DO $$ 
BEGIN
  -- Check for stripe_subscription_id column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN stripe_subscription_id TEXT;
  END IF;

  -- Check for plan_type column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN plan_type TEXT DEFAULT 'free';
  END IF;

  -- Check for status column
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN status TEXT DEFAULT 'inactive';
  END IF;
END $$;

-- Fix rows with NULL values
UPDATE public.user_subscriptions
SET 
  plan_type = COALESCE(plan_type, 'free'),
  status = COALESCE(status, 'inactive'),
  created_at = COALESCE(created_at, CURRENT_TIMESTAMP),
  updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP);

-- Ensure rows exist for all users (using profiles table as source of users)
INSERT INTO public.user_subscriptions (
  user_id, 
  plan_type, 
  status, 
  created_at, 
  updated_at
)
SELECT 
  p.id,
  p.tier,
  CASE WHEN p.tier = 'premium' OR p.tier = 'family' THEN 'active' ELSE 'inactive' END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
WHERE us.id IS NULL;

-- For premium users with missing subscription_id, set a placeholder value
UPDATE public.user_subscriptions
SET 
  subscription_id = 'manual_subscription_' || user_id,
  stripe_subscription_id = 'manual_subscription_' || user_id
WHERE 
  plan_type = 'premium' 
  AND (subscription_id IS NULL OR subscription_id = '')
  AND (stripe_subscription_id IS NULL OR stripe_subscription_id = '');

-- Ensure subscription status is active for premium users
UPDATE public.user_subscriptions
SET status = 'active'
WHERE plan_type = 'premium' AND status = 'inactive';

-- Ensure current_period_end has a value for premium users
UPDATE public.user_subscriptions
SET current_period_end = CURRENT_TIMESTAMP + interval '1 year'
WHERE plan_type = 'premium' 
  AND (current_period_end IS NULL OR current_period_end < CURRENT_TIMESTAMP);

-- Set all fields for premium users
UPDATE public.user_subscriptions
SET
  price_id = COALESCE(price_id, 'price_premium_monthly'),
  stripe_customer_id = COALESCE(stripe_customer_id, 'customer_' || user_id)
WHERE plan_type = 'premium';

-- Sync profiles.tier with user_subscriptions.plan_type
-- Update the user_subscriptions table from profiles
UPDATE public.user_subscriptions us
SET 
  plan_type = p.tier,
  status = CASE WHEN p.tier = 'premium' OR p.tier = 'family' THEN 'active' ELSE 'inactive' END
FROM public.profiles p
WHERE us.user_id = p.id AND us.plan_type != p.tier;

-- Ensure unique constraint exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'unique_user_subscription'
  ) THEN
    ALTER TABLE public.user_subscriptions
    ADD CONSTRAINT unique_user_subscription UNIQUE (user_id);
  END IF;
END $$;

-- Ensure NOT NULL constraint on user_id
ALTER TABLE public.user_subscriptions 
ALTER COLUMN user_id SET NOT NULL;

-- Create update trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_user_subscriptions_updated_at(); 