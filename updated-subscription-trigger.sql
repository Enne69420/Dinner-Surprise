-- First, ensure that current_period_start exists in the table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions' 
    AND column_name = 'current_period_start'
  ) THEN
    ALTER TABLE public.user_subscriptions ADD COLUMN current_period_start TIMESTAMPTZ;
  END IF;
END $$;

-- Create a function that will be triggered when a new profile is created
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a subscription
  IF EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = NEW.id) THEN
    -- Update existing subscription to match the profile
    UPDATE public.user_subscriptions
    SET 
      plan_type = NEW.tier,
      status = 'active',
      current_period_start = NEW.created_at,
      current_period_end = (NEW.created_at + interval '1 month'),
      updated_at = NEW.updated_at
    WHERE user_id = NEW.id;
  ELSE
    -- Insert a new record into user_subscriptions
    INSERT INTO public.user_subscriptions (
      user_id,
      plan_type,
      status,
      current_period_start,
      current_period_end,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.tier,
      'active',
      NEW.created_at,
      (NEW.created_at + interval '1 month'),
      NEW.created_at,
      NEW.updated_at
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to run after a new profile is inserted
DROP TRIGGER IF EXISTS create_subscription_for_new_profile ON public.profiles;
CREATE TRIGGER create_subscription_for_new_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION create_user_subscription(); 