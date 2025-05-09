-- Updated function definitions with security improvements

-- 1. Function: handle_user_delete
CREATE OR REPLACE FUNCTION public.handle_user_delete()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
BEGIN
  -- Delete user-related data when user is deleted
  DELETE FROM public.recipes WHERE user_id = OLD.id;
  RETURN OLD;
END;
$$;

-- 2. Function: reset_monthly_usage
CREATE OR REPLACE FUNCTION public.reset_monthly_usage()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
DECLARE
    current_month INTEGER;
    last_reset_month INTEGER;
BEGIN
    -- Get the month from the current timestamp and last_reset
    current_month := EXTRACT(MONTH FROM CURRENT_TIMESTAMP);
    last_reset_month := EXTRACT(MONTH FROM OLD.last_reset);
    
    -- If the month has changed, reset the usage counter
    IF current_month != last_reset_month THEN
        NEW.monthly_usage := 0;
        NEW.last_reset := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$;

-- 3. Function: increment_usage
CREATE OR REPLACE FUNCTION public.increment_usage(user_id UUID)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
BEGIN
    -- First check if month has changed
    UPDATE public.profiles
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id;
    
    -- Then increment the usage
    UPDATE public.profiles
    SET monthly_usage = monthly_usage + 1
    WHERE id = user_id;
END;
$$;

-- 4. Function: enforce_recipe_limits
CREATE OR REPLACE FUNCTION public.enforce_recipe_limits()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
DECLARE
    recipe_count INTEGER;
    user_tier TEXT;
BEGIN
    -- Get user's tier
    SELECT tier INTO user_tier FROM public.profiles WHERE id = NEW.user_id;
    
    -- Count user's recipes
    SELECT COUNT(*) INTO recipe_count FROM public.recipes WHERE user_id = NEW.user_id;
    
    -- If free tier and already has 5 recipes, prevent insert
    IF user_tier = 'free' AND recipe_count >= 5 THEN
        RAISE EXCEPTION 'Free tier users can only save up to 5 recipes';
    END IF;
    
    RETURN NEW;
END;
$$;

-- 5. Function: handle_new_signup
CREATE OR REPLACE FUNCTION public.handle_new_signup()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
BEGIN
  -- This function would handle additional signup logic
  -- For example, send welcome email, create default data, etc.
  -- Implementation depends on specific requirements
  
  -- Send dummy notification
  -- PERFORM public.send_welcome_notification(NEW.id);
  
  RETURN NEW;
END;
$$;

-- 6. Function: handle_new_user_profile
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
BEGIN
  -- This function would handle additional logic when a profile is created
  -- For example, setting default preferences, etc.
  -- Implementation depends on specific requirements
  
  -- Set default preferences (example)
  -- UPDATE public.profiles SET preferences = '{}' WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- 7. Function: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public, pg_catalog
AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$; 