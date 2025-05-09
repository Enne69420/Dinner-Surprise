-- Function to ensure user subscription is created from profile
CREATE OR REPLACE FUNCTION ensure_user_subscription(user_id_param uuid)
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
$$ LANGUAGE plpgsql;

-- Function to check if user can save recipe
CREATE OR REPLACE FUNCTION can_save_recipe(user_id_param uuid)
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
$$ LANGUAGE plpgsql;

-- Override save_recipe function to use both tables
CREATE OR REPLACE FUNCTION save_recipe(
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
$$ LANGUAGE plpgsql; 