-- Create a safe clone of create_user function with security fixes

-- Create a secure version with a different name
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

-- Output information about the operation
DO $$
BEGIN
  RAISE NOTICE 'Created secure version of create_user function.';
  RAISE NOTICE 'IMPORTANT: To use this function, you must update the trigger that uses create_user.';
  RAISE NOTICE 'The secure function is named: create_user_secure';
END $$; 