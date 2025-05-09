-- Script to verify that user profiles are being created correctly

-- Check the current implementation of the create_user function
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'create_user' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND pronargs = 0;

-- Check if there's a trigger on auth.users that uses the create_user function
SELECT t.tgname AS trigger_name, 
       p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
AND p.proname = 'create_user';

-- Check that the profiles table has the necessary columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position; 