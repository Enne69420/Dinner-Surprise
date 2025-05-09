-- Minimal security fix for create_user function
-- Simply adds search_path parameter to the specific function causing the warning

-- Fix the trigger function with no parameters
ALTER FUNCTION public.create_user() SET search_path = public; 