-- Simple fix for create_user function search_path issue
-- Just adds the search_path parameter without changing the function 

DO $$
BEGIN
  -- Apply search_path to all create_user functions
  FOR r IN SELECT proname, pronargs 
           FROM pg_proc 
           WHERE proname = 'create_user' 
           AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  LOOP
    IF r.pronargs = 0 THEN
      -- For the no-argument version (trigger function)
      EXECUTE 'ALTER FUNCTION public.create_user() SET search_path = public';
      RAISE NOTICE 'Fixed search_path for create_user() function';
    ELSE
      -- For other versions with parameters
      EXECUTE 'ALTER FUNCTION public.create_user(' || 
              (SELECT string_agg(pg_get_function_identity_arguments(p.oid), ', ')
               FROM pg_proc p 
               WHERE p.proname = 'create_user' 
               AND p.pronargs = r.pronargs
               AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) ||
              ') SET search_path = public';
      RAISE NOTICE 'Fixed search_path for create_user function with % parameters', r.pronargs;
    END IF;
  END LOOP;
END $$; 