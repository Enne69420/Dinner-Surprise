-- Create a function that will be triggered when a new profile is created
CREATE OR REPLACE FUNCTION create_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger to run after a new profile is inserted
DROP TRIGGER IF EXISTS create_subscription_for_new_profile ON public.profiles;
CREATE TRIGGER create_subscription_for_new_profile
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION create_user_subscription(); 