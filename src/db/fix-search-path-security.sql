-- Fix SQL Functions with Function Search Path Mutable issues

-- Fix create_user_subscriptions_table function
CREATE OR REPLACE FUNCTION public.create_user_subscriptions_table()
RETURNS void AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions'
  ) THEN
    -- Create the user_subscriptions table
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
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix update_user_subscriptions_updated_at function
CREATE OR REPLACE FUNCTION public.update_user_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix exec_sql function
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void AS $$
BEGIN
  EXECUTE sql;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL execution failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER 
SET search_path = public;

-- Fix create_user_subscription function
CREATE OR REPLACE FUNCTION public.create_user_subscription()
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
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix create_user function
CREATE OR REPLACE FUNCTION public.create_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix ensure_user_subscription function
CREATE OR REPLACE FUNCTION public.ensure_user_subscription(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  profile_record RECORD;
  subscription_exists boolean;
BEGIN
  -- Check if subscription already exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_subscriptions 
    WHERE user_id = user_id_param
  ) INTO subscription_exists;
  
  IF subscription_exists THEN
    RETURN true;
  END IF;
  
  -- Get profile data
  SELECT * FROM public.profiles
  WHERE id = user_id_param
  INTO profile_record;
  
  IF profile_record IS NULL THEN
    RAISE EXCEPTION 'Profile not found for user %', user_id_param;
  END IF;
  
  -- Create subscription from profile
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
    user_id_param,
    profile_record.tier,
    'active',
    COALESCE(profile_record.created_at, now()),
    COALESCE(profile_record.created_at, now()) + interval '1 month',
    COALESCE(profile_record.created_at, now()),
    COALESCE(profile_record.updated_at, now())
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error ensuring user subscription: %', SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix can_save_recipe function
CREATE OR REPLACE FUNCTION public.can_save_recipe(user_id_param uuid)
RETURNS boolean AS $$
DECLARE
  profile_record RECORD;
  subscription_record RECORD;
  can_save boolean;
  has_subscription boolean;
BEGIN
  -- Ensure user subscription exists
  PERFORM ensure_user_subscription(user_id_param);
  
  -- Check both profile and subscription
  SELECT * FROM public.profiles
  WHERE id = user_id_param
  INTO profile_record;
  
  SELECT * FROM public.user_subscriptions
  WHERE user_id = user_id_param
  INTO subscription_record;
  
  -- Check if user can save recipe based on subscription plan
  IF subscription_record.plan_type = 'premium' OR subscription_record.plan_type = 'family' THEN
    -- Premium users can always save
    can_save := true;
  ELSE
    -- Free users have a limit
    can_save := (profile_record.saved_recipes_count < 5);
  END IF;
  
  RETURN can_save;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix save_recipe function
CREATE OR REPLACE FUNCTION public.save_recipe(
  user_id_param uuid,
  recipe_data jsonb
)
RETURNS jsonb AS $$
DECLARE
  profile_record RECORD;
  can_save boolean;
  result_record RECORD;
BEGIN
  -- Check if user can save recipe
  can_save := can_save_recipe(user_id_param);
  
  IF NOT can_save THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Free plan users can only save up to 5 recipes. Please upgrade to premium for unlimited recipes.'
    );
  END IF;
  
  -- Get profile for updating
  SELECT * FROM public.profiles
  WHERE id = user_id_param
  INTO profile_record;
  
  -- Save recipe
  INSERT INTO public.recipes (
    user_id,
    title,
    ingredients,
    steps,
    servings,
    cooking_time,
    difficulty,
    calories,
    protein,
    created_at,
    updated_at
  )
  VALUES (
    user_id_param,
    recipe_data->>'title',
    recipe_data->'ingredients',
    recipe_data->'steps',
    (recipe_data->>'servings')::int,
    recipe_data->>'cooking_time',
    recipe_data->>'difficulty',
    (recipe_data->>'calories')::int,
    (recipe_data->>'protein')::int,
    now(),
    now()
  )
  RETURNING * INTO result_record;
  
  -- Update saved_recipes_count if on free plan
  IF profile_record.tier = 'free' THEN
    UPDATE public.profiles
    SET 
      saved_recipes_count = COALESCE(saved_recipes_count, 0) + 1,
      updated_at = now()
    WHERE id = user_id_param;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Recipe saved successfully',
    'recipe', to_jsonb(result_record)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public; 