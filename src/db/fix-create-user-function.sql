-- Fix just the create_user function with mutable search_path

-- Fix the problem by setting the search path explicitly
DO $$
BEGIN
  -- Check if the function exists and update it
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'create_user' 
    AND pronargs = 0
  ) THEN
    -- Update the function to use search_path
    EXECUTE 'ALTER FUNCTION public.create_user() SET search_path = public';
  END IF;
END $$; 