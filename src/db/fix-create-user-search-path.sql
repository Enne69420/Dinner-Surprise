-- Fix search_path issue for both versions of the create_user function

-- Fix the trigger function version of create_user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Fix the programmatic function version of create_user (if it exists)
DO $$
BEGIN
    -- Check if the function with parameters exists
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'create_user' 
        AND pronargs > 0
    ) THEN
        -- Update the function to set search_path
        EXECUTE '
        CREATE OR REPLACE FUNCTION public.create_user(
            email text,
            password text,
            user_role text DEFAULT ''authenticated'',
            user_metadata jsonb DEFAULT ''{}''::jsonb
        ) RETURNS uuid AS $$
        DECLARE
            user_id uuid;
            encrypted_pw text;
            now_time timestamptz := now();
        BEGIN
            -- Generate UUID for new user
            user_id := gen_random_uuid();
            
            -- Encrypt password using Supabase Auth''s method (bcrypt)
            encrypted_pw := crypt(password, gen_salt(''bf''));
            
            -- Insert into auth.users table
            INSERT INTO auth.users (
                instance_id,
                id,
                aud,
                role,
                email,
                encrypted_password,
                email_confirmed_at,
                recovery_sent_at,
                last_sign_in_at,
                raw_app_meta_data,
                raw_user_meta_data,
                created_at,
                updated_at,
                confirmation_token,
                email_change,
                email_change_token_new,
                recovery_token
            ) VALUES (
                ''00000000-0000-0000-0000-000000000000'',
                user_id,
                ''authenticated'',
                user_role,
                email,
                encrypted_pw,
                now_time, -- Email auto-confirmed
                NULL,
                NULL,
                ''{"provider":"email","providers":["email"]}''::jsonb,
                user_metadata,
                now_time,
                now_time,
                '''',
                '''',
                '''',
                ''''
            );
            
            -- Insert into auth.identities table (required for login)
            INSERT INTO auth.identities (
                id,
                provider_id,
                user_id,
                identity_data,
                provider,
                last_sign_in_at,
                created_at,
                updated_at
            ) VALUES (
                gen_random_uuid(),
                user_id,
                user_id,
                jsonb_build_object(
                    ''sub'', user_id::text,
                    ''email'', email,
                    ''email_verified'', ''true'',
                    ''phone_verified'', ''false''
                ),
                ''email'',
                now_time,
                now_time,
                now_time
            );
            
            -- The trigger on auth.users will automatically create profile
            
            RETURN user_id;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER
        SET search_path = public;
        ';
    END IF;
END $$; 