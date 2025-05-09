-- Comprehensive secure fix for create_user function
-- This script creates a secure version and carefully updates any references

-- Step 1: Create a secure version of the function
CREATE OR REPLACE FUNCTION public.create_user_secure() 
RETURNS TRIGGER AS $$
BEGIN
  -- Maintain the same behavior as the original
  INSERT INTO public.profiles (id, tier)
  VALUES (NEW.id, 'free');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Step 2: Find and update any triggers using the original function
DO $$
DECLARE
  trigger_info RECORD;
  v_count INTEGER := 0;
BEGIN
  -- Find all triggers using the create_user function
  FOR trigger_info IN 
    SELECT tgname, tgrelid::regclass AS table_name
    FROM pg_trigger
    WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'create_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'))
  LOOP
    v_count := v_count + 1;
    RAISE NOTICE 'Found trigger: % on table %', trigger_info.tgname, trigger_info.table_name;
    
    -- Recreate the trigger with the secure function
    EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_info.tgname) || ' ON ' || trigger_info.table_name;
    EXECUTE 'CREATE TRIGGER ' || quote_ident(trigger_info.tgname) ||
            ' AFTER INSERT ON ' || trigger_info.table_name ||
            ' FOR EACH ROW EXECUTE FUNCTION public.create_user_secure()';
  END LOOP;
  
  IF v_count > 0 THEN
    RAISE NOTICE 'Updated % trigger(s) to use create_user_secure', v_count;
  ELSE
    RAISE NOTICE 'No triggers using create_user function were found.';
    
    -- Handle the case where we don't find any triggers but the function exists
    -- (it might be using a different approach)
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user' AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
      -- Add search_path to the original function without changing its behavior
      EXECUTE 'ALTER FUNCTION public.create_user() SET search_path = public';
      RAISE NOTICE 'Applied search_path fix to original create_user function';
    END IF;
  END IF;
END $$;

-- Step 3: Check for auth.users trigger specifically (most common case)
DO $$
BEGIN
  -- Common setup: Check if we need to create a trigger on auth.users
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'create_user_secure') AND
     NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgfoid = (SELECT oid FROM pg_proc WHERE proname = 'create_user_secure')) THEN
    
    -- Try to create the trigger if it doesn't exist already
    BEGIN
      EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
      EXECUTE 'CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_user_secure()';
      RAISE NOTICE 'Created new on_auth_user_created trigger on auth.users';
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create trigger: %', SQLERRM;
    END;
  END IF;
END $$; 