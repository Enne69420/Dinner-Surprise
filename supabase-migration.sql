-- Add saved_recipes_count column to profiles if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'saved_recipes_count'
    ) THEN
        ALTER TABLE profiles ADD COLUMN saved_recipes_count INTEGER DEFAULT 0;
    END IF;

    -- Ensure monthly_usage column exists and has default value
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'monthly_usage'
    ) THEN
        ALTER TABLE profiles ADD COLUMN monthly_usage INTEGER DEFAULT 0;
    END IF;

    -- Ensure last_reset column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'last_reset'
    ) THEN
        ALTER TABLE profiles ADD COLUMN last_reset TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Create user_subscriptions table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_type TEXT DEFAULT 'free',
    subscription_id TEXT,
    price_id TEXT,
    status TEXT DEFAULT 'inactive',
    stripe_customer_id TEXT,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_subscription UNIQUE (user_id)
);

-- Create initial subscription records for all users who don't have one
INSERT INTO user_subscriptions (user_id, plan_type, status, created_at, updated_at)
SELECT id, tier, 'inactive', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM profiles
WHERE NOT EXISTS (
    SELECT 1 
    FROM user_subscriptions 
    WHERE user_subscriptions.user_id = profiles.id
);

-- Drop existing triggers and functions
DROP TRIGGER IF EXISTS check_month_change ON profiles;
DROP FUNCTION IF EXISTS reset_monthly_usage() CASCADE;
DROP FUNCTION IF EXISTS check_and_reset_monthly_usage() CASCADE;
DROP FUNCTION IF EXISTS decrement_saved_recipes_count(UUID) CASCADE;

-- Create function to check and reset monthly usage
CREATE OR REPLACE FUNCTION check_and_reset_monthly_usage()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.last_reset < date_trunc('month', CURRENT_TIMESTAMP) THEN
        NEW.monthly_usage := 0;
        NEW.last_reset := CURRENT_TIMESTAMP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create trigger to check for month change
CREATE TRIGGER check_month_change
    BEFORE INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION check_and_reset_monthly_usage();

-- Create function to decrement saved recipes count
CREATE OR REPLACE FUNCTION decrement_saved_recipes_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    current_count INTEGER;
BEGIN
    -- Get current count
    SELECT saved_recipes_count INTO current_count
    FROM profiles
    WHERE id = user_id;

    -- Decrement count, ensuring it doesn't go below 0
    UPDATE profiles
    SET saved_recipes_count = GREATEST(0, current_count - 1)
    WHERE id = user_id;

    -- Return new count
    RETURN GREATEST(0, current_count - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Create grocery_lists table if it doesn't exist
CREATE TABLE IF NOT EXISTS grocery_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on grocery_lists
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

-- Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for grocery_lists
DROP POLICY IF EXISTS "Users can view own grocery lists" ON grocery_lists;
CREATE POLICY "Users can view own grocery lists"
    ON grocery_lists FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own grocery lists" ON grocery_lists;
CREATE POLICY "Users can insert own grocery lists"
    ON grocery_lists FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own grocery lists" ON grocery_lists;
CREATE POLICY "Users can update own grocery lists"
    ON grocery_lists FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own grocery lists" ON grocery_lists;
CREATE POLICY "Users can delete own grocery lists"
    ON grocery_lists FOR DELETE
    USING (auth.uid() = user_id);

-- Drop and recreate policies for user_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view own subscriptions"
    ON user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can update own subscriptions"
    ON user_subscriptions FOR UPDATE
    USING (auth.uid() = user_id);

-- Update recipes table structure
DO $$ 
BEGIN
    -- Drop old columns if they exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE recipes DROP COLUMN description;
    END IF;

    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'instructions'
    ) THEN
        ALTER TABLE recipes DROP COLUMN instructions;
    END IF;

    -- Add new columns if they don't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'steps'
    ) THEN
        ALTER TABLE recipes ADD COLUMN steps JSONB;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'servings'
    ) THEN
        ALTER TABLE recipes ADD COLUMN servings INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'cooking_time'
    ) THEN
        ALTER TABLE recipes ADD COLUMN cooking_time TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'difficulty'
    ) THEN
        ALTER TABLE recipes ADD COLUMN difficulty TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'calories'
    ) THEN
        ALTER TABLE recipes ADD COLUMN calories INTEGER;
    END IF;

    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'recipes' 
        AND column_name = 'protein'
    ) THEN
        ALTER TABLE recipes ADD COLUMN protein INTEGER;
    END IF;
END $$;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON recipes;

-- Recreate policies
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Users can view own recipes"
    ON recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recipes"
    ON recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recipes"
    ON recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recipes"
    ON recipes FOR DELETE
    USING (auth.uid() = user_id); 