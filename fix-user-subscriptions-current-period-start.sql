-- Add current_period_start column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'current_period_start'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
    
    -- If current_period_end exists, set current_period_start to a month before
    UPDATE public.user_subscriptions
    SET current_period_start = current_period_end - interval '1 month'
    WHERE current_period_end IS NOT NULL;
    
    -- Otherwise set to created_at or now()
    UPDATE public.user_subscriptions
    SET current_period_start = COALESCE(created_at, now())
    WHERE current_period_start IS NULL;
  END IF;
END $$;

-- If you are migrating data from profiles to user_subscriptions, make sure to update
-- the SQL in fix-user-subscriptions.sql to match the actual table structure 