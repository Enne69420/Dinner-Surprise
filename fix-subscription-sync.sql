-- Fix subscription tables synchronization issues

-- Add stripe_subscription_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN stripe_subscription_id TEXT;
  END IF;
END $$;

-- Fix inconsistency between column names
DO $$ 
BEGIN
  -- Check if subscription_status exists but status doesn't
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'subscription_status'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'status'
  ) THEN
    -- Add status column and copy data from subscription_status
    ALTER TABLE public.user_subscriptions ADD COLUMN status TEXT;
    UPDATE public.user_subscriptions SET status = subscription_status;
  END IF;
END $$;

-- Ensure plan_type column exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'plan_type'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN plan_type TEXT DEFAULT 'free';
  END IF;
END $$;

-- Fix rows with null created_at and updated_at
UPDATE public.user_subscriptions
SET 
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL OR updated_at IS NULL;

-- Make the user_id NOT NULL to prevent future issues
ALTER TABLE public.user_subscriptions 
ALTER COLUMN user_id SET NOT NULL;

-- Set default values for important fields if they were NULL
UPDATE public.user_subscriptions
SET 
  plan_type = COALESCE(plan_type, 'free'),
  status = COALESCE(status, 'inactive')
WHERE plan_type IS NULL OR status IS NULL;

-- Ensure there's only one subscription record per user (for multiple records, keep the most recent)
WITH ranked_subscriptions AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM public.user_subscriptions
  WHERE user_id IS NOT NULL
)
DELETE FROM public.user_subscriptions
WHERE id IN (
  SELECT id FROM ranked_subscriptions WHERE rn > 1
);

-- Ensure both subscription_id and stripe_subscription_id are populated if either exists
UPDATE public.user_subscriptions
SET 
  subscription_id = COALESCE(subscription_id, stripe_subscription_id),
  stripe_subscription_id = COALESCE(stripe_subscription_id, subscription_id)
WHERE 
  (subscription_id IS NULL AND stripe_subscription_id IS NOT NULL) 
  OR 
  (stripe_subscription_id IS NULL AND subscription_id IS NOT NULL);

-- Set status to active for premium users who have a subscription ID
UPDATE public.user_subscriptions
SET 
  status = 'active'
WHERE 
  plan_type = 'premium' 
  AND (status IS NULL OR status = 'inactive')
  AND (subscription_id IS NOT NULL OR stripe_subscription_id IS NOT NULL);

-- Synchronize profiles.tier with user_subscriptions.plan_type
-- First, update user_subscriptions based on profiles (if profile is premium)
UPDATE public.user_subscriptions us
SET 
  plan_type = p.tier,
  status = CASE WHEN p.tier = 'premium' THEN 'active' ELSE 'inactive' END,
  updated_at = CURRENT_TIMESTAMP
FROM public.profiles p
WHERE 
  us.user_id = p.id
  AND p.tier = 'premium'
  AND us.plan_type != 'premium';

-- Then update profiles based on user_subscriptions (if subscription is free)
UPDATE public.profiles p
SET 
  tier = us.plan_type,
  updated_at = CURRENT_TIMESTAMP
FROM public.user_subscriptions us
WHERE 
  p.id = us.user_id
  AND us.plan_type = 'free'
  AND p.tier != 'free';

-- Create missing user_subscriptions records for users who don't have one
INSERT INTO public.user_subscriptions (user_id, plan_type, status, created_at, updated_at)
SELECT 
  p.id, 
  p.tier, 
  CASE WHEN p.tier = 'premium' THEN 'active' ELSE 'inactive' END,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM public.profiles p
LEFT JOIN public.user_subscriptions us ON p.id = us.user_id
WHERE us.id IS NULL;

-- Add unique constraint if it doesn't exist
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

-- Create or replace trigger for updating the updated_at column
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