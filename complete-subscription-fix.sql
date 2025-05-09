-- Comprehensive fix for user_subscriptions table
-- This script addresses the "column current_period_start does not exist" error
-- by ensuring the column exists before any operations try to use it

-- First, check if the table exists, if not create it with all required columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions'
  ) THEN
    CREATE TABLE public.user_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      subscription_id TEXT,
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'family')),
      price_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Create indexes for faster lookups
    CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
    CREATE INDEX idx_user_subscriptions_subscription_id ON public.user_subscriptions(subscription_id);
    CREATE INDEX idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);

    -- Set up RLS (Row Level Security)
    ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

    -- Create policies for RLS
    -- 1. Users can read their own subscription data
    CREATE POLICY "Users can read their own subscription data"
      ON public.user_subscriptions
      FOR SELECT
      USING (auth.uid() = user_id);

    -- 2. Service role can manage all subscription data
    CREATE POLICY "Service role can manage all subscription data"
      ON public.user_subscriptions
      USING (true)
      WITH CHECK (true);
  ELSE
    -- If table exists, add any missing columns

    -- 1. Add current_period_start if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name = 'current_period_start'
    ) THEN
      ALTER TABLE public.user_subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
    END IF;

    -- 2. Add current_period_end if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name = 'current_period_end'
    ) THEN
      ALTER TABLE public.user_subscriptions ADD COLUMN current_period_end TIMESTAMPTZ;
    END IF;

    -- 3. Add plan_type if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name = 'plan_type'
    ) THEN
      ALTER TABLE public.user_subscriptions ADD COLUMN plan_type TEXT DEFAULT 'free';
    END IF;

    -- 4. Handle missing or misnamed status column
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
      -- Rename subscription_status to status
      ALTER TABLE public.user_subscriptions RENAME COLUMN subscription_status TO status;
    ELSIF NOT EXISTS (
      SELECT 1 
      FROM information_schema.columns 
      WHERE table_name = 'user_subscriptions' 
      AND column_name = 'status'
    ) THEN
      -- Add status column if neither exists
      ALTER TABLE public.user_subscriptions ADD COLUMN status TEXT DEFAULT 'inactive';
    END IF;
  END IF;
END
$$;

-- Clean up empty rows in user_subscriptions table
-- First, find all problematic rows where user_id is NULL
WITH problematic_rows AS (
  SELECT id 
  FROM public.user_subscriptions 
  WHERE user_id IS NULL
)
-- Delete these rows
DELETE FROM public.user_subscriptions
WHERE id IN (SELECT id FROM problematic_rows);

-- Fix rows with null created_at and updated_at
UPDATE public.user_subscriptions
SET 
  created_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
WHERE created_at IS NULL OR updated_at IS NULL;

-- Calculate current_period_start from current_period_end or created_at
UPDATE public.user_subscriptions
SET current_period_start = CASE
  WHEN current_period_end IS NOT NULL THEN current_period_end - interval '1 month'
  ELSE COALESCE(created_at, now())
END
WHERE current_period_start IS NULL;

-- Set default values for important fields if they were NULL
UPDATE public.user_subscriptions
SET 
  plan_type = COALESCE(plan_type, 'free'),
  status = COALESCE(status, 'inactive')
WHERE plan_type IS NULL OR status IS NULL;

-- Update created_at and updated_at to ALWAYS have default values (fix schema)
ALTER TABLE public.user_subscriptions 
ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.user_subscriptions 
ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP;

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

-- Add trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_subscriptions_updated_at ON public.user_subscriptions;

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE PROCEDURE update_user_subscriptions_updated_at();

-- Then insert data from profiles into user_subscriptions
-- Only insert for profiles that don't already have a subscription
INSERT INTO public.user_subscriptions (
  user_id,
  plan_type,
  status,
  current_period_start,
  current_period_end,
  created_at,
  updated_at
)
SELECT 
  id AS user_id,
  tier AS plan_type,
  'active' AS status,
  created_at AS current_period_start,
  (created_at + interval '1 month') AS current_period_end,
  created_at,
  updated_at
FROM 
  public.profiles p
WHERE 
  NOT EXISTS (
    SELECT 1 FROM public.user_subscriptions us WHERE us.user_id = p.id
  );

-- Count how many records were inserted
DO $$
DECLARE
  inserted_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO inserted_count FROM public.user_subscriptions;
  RAISE NOTICE 'Total user_subscriptions after migration: %', inserted_count;
END
$$; 