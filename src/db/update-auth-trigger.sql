-- Update auth user trigger to use secure function version

-- First, get information about the trigger using create_user
DO $$
DECLARE
  trigger_info RECORD;
BEGIN
  SELECT tgname, tgrelid::regclass AS table_name
  INTO trigger_info
  FROM pg_trigger
  WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'create_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'));
  
  IF FOUND THEN
    RAISE NOTICE 'Found trigger: % on table %', trigger_info.tgname, trigger_info.table_name;
    
    -- Drop the existing trigger
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_info.tgname) || ' ON ' || trigger_info.table_name;
    
    -- Recreate the trigger with the secure function
    EXECUTE 'CREATE TRIGGER ' || quote_ident(trigger_info.tgname) ||
            ' AFTER INSERT ON ' || trigger_info.table_name ||
            ' FOR EACH ROW EXECUTE FUNCTION public.create_user_secure()';
            
    RAISE NOTICE 'Successfully updated trigger to use create_user_secure';
  ELSE
    RAISE NOTICE 'No trigger using create_user function was found.';
  END IF;
END $$; 