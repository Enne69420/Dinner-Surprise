-- Script to check current create_user function definition
DO $$ 
DECLARE
  func_def text;
BEGIN
  -- Get the function definition
  SELECT pg_get_functiondef(p.oid)
  INTO func_def
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE p.proname = 'create_user'
  AND n.nspname = 'public'
  AND pronargs = 0;

  -- Output the function definition for inspection
  RAISE NOTICE 'Current create_user function definition: %', func_def;
END $$; 