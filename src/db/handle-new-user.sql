-- Simplified fix for the user creation error
-- First, check the profiles table structure
DO $$
DECLARE
    tier_exists boolean;
BEGIN
    -- Check if the tier column exists in profiles table
    SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'tier'
    ) INTO tier_exists;

    -- Output debugging information
    RAISE NOTICE 'tier column exists: %', tier_exists;

    IF tier_exists THEN
        -- If tier column exists, update the trigger function
        EXECUTE 'DROP FUNCTION IF EXISTS public.create_user() CASCADE';
        
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.create_user() 
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.profiles (id, tier)
            VALUES (NEW.id, ''free'');
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = public';
    ELSE
        -- If tier column doesn't exist, use simpler function
        EXECUTE 'DROP FUNCTION IF EXISTS public.create_user() CASCADE';
        
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.create_user() 
        RETURNS TRIGGER AS $$
        BEGIN
            INSERT INTO public.profiles (id)
            VALUES (NEW.id);
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = public';
    END IF;

    -- Recreate the trigger
    EXECUTE 'DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users';
    
    EXECUTE '
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.create_user()';
    
    RAISE NOTICE 'User creation trigger successfully updated';
END $$; 