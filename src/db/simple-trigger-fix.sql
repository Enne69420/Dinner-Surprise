-- Simple fix for create_user trigger function
-- This script avoids nested BEGIN blocks that were causing syntax errors

-- First drop the function if it exists (this will also drop dependent triggers)
DROP FUNCTION IF EXISTS public.create_user() CASCADE;

-- Create a new version of the function with proper search_path setting
CREATE OR REPLACE FUNCTION public.create_user() 
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the tier column exists in the profiles table
    IF EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tier'
    ) THEN
        -- If tier column exists, include it
        INSERT INTO public.profiles (id, tier)
        VALUES (NEW.id, 'free');
    ELSE
        -- Otherwise just insert the ID
        INSERT INTO public.profiles (id)
        VALUES (NEW.id);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.create_user(); 