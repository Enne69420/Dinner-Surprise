-- Create profiles table linked to auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'premium')),
    monthly_usage INTEGER NOT NULL DEFAULT 0,
    saved_recipes_count INTEGER NOT NULL DEFAULT 0,
    last_reset TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user-owned recipes table with tier-based limits
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    ingredients TEXT[] NOT NULL,
    steps TEXT[] NOT NULL,
    servings INTEGER NOT NULL,
    cooking_time TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    calories INTEGER,
    protein INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to reset monthly usage at the beginning of each month
CREATE OR REPLACE FUNCTION reset_monthly_usage() 
RETURNS TRIGGER AS $$
DECLARE
    current_month INTEGER;
    last_reset_month INTEGER;
BEGIN
    -- Get the month from the current timestamp and last_reset
    current_month := EXTRACT(MONTH FROM CURRENT_TIMESTAMP);
    last_reset_month := EXTRACT(MONTH FROM OLD.last_reset);
    
    -- If the month has changed, reset the usage counter
    IF current_month != last_reset_month THEN
        NEW.monthly_usage := 0;
        NEW.last_reset := CURRENT_TIMESTAMP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to check for month change on every profile update
CREATE TRIGGER check_month_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION reset_monthly_usage();

-- Function to increment usage count
CREATE OR REPLACE FUNCTION increment_monthly_usage(user_id UUID) 
RETURNS void AS $$
BEGIN
    -- First check if month has changed
    UPDATE public.profiles
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = user_id;
    
    -- Then increment the usage
    UPDATE public.profiles
    SET monthly_usage = monthly_usage + 1
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policies for recipes
CREATE POLICY "Users can view their own recipes"
    ON public.recipes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recipes"
    ON public.recipes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes"
    ON public.recipes FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes"
    ON public.recipes FOR DELETE
    USING (auth.uid() = user_id);

-- Create trigger to enforce tier-based limits on recipe creation
CREATE OR REPLACE FUNCTION enforce_recipe_limits()
RETURNS TRIGGER AS $$
DECLARE
    recipe_count INTEGER;
    user_tier TEXT;
BEGIN
    -- Get user's tier
    SELECT tier INTO user_tier FROM public.profiles WHERE id = NEW.user_id;
    
    -- Count user's recipes
    SELECT COUNT(*) INTO recipe_count FROM public.recipes WHERE user_id = NEW.user_id;
    
    -- If free tier and already has 5 recipes, prevent insert
    IF user_tier = 'free' AND recipe_count >= 5 THEN
        RAISE EXCEPTION 'Free tier users can only save up to 5 recipes';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for recipe limit enforcement
CREATE TRIGGER enforce_recipe_limit_trigger
BEFORE INSERT ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION enforce_recipe_limits();

-- Trigger to create a profile automatically when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Set up trigger on auth.users to create profile
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user(); 