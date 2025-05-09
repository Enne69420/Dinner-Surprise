-- Final fix for create_user functions
-- This minimal script adds search_path to both functions and ensures the trigger creates profiles correctly

-- 1. Fix the trigger function with no parameters
ALTER FUNCTION public.create_user() SET search_path = public;

-- 2. Fix the function with parameters 
ALTER FUNCTION public.create_user(email text, password text, user_role text, user_metadata jsonb) SET search_path = public;

-- 3. Update the trigger function to properly handle profile creation
CREATE OR REPLACE FUNCTION public.create_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into profiles with tier column
    INSERT INTO public.profiles (id, tier)
    VALUES (NEW.id, 'free');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public; 