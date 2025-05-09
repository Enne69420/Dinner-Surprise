-- Fix both create_user functions to set search_path parameter

-- First, fix the trigger function with no parameters
ALTER FUNCTION public.create_user() SET search_path = public;

-- Second, fix the function with parameters 
-- Based on your screenshot, it takes email, password, etc.
ALTER FUNCTION public.create_user(email text, password text, user_role text, user_metadata jsonb) SET search_path = public; 