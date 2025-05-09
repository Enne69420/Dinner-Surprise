-- Complete fix for grocery lists database issues

-- First, fix any broken rows
DO $$ 
BEGIN
  -- If the old table exists but has issues, clean it up
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'grocery_lists' AND table_schema = 'public'
  ) THEN
    -- Add user_id NOT NULL constraint if missing
    BEGIN
      ALTER TABLE public.grocery_lists ALTER COLUMN user_id SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      -- If this fails, log but continue
      RAISE NOTICE 'Could not add NOT NULL constraint to user_id: %', SQLERRM;
    END;
    
    -- Delete any rows with NULL user_id
    DELETE FROM public.grocery_lists WHERE user_id IS NULL;
    
    -- Make sure items field defaults to empty array
    BEGIN
      ALTER TABLE public.grocery_lists ALTER COLUMN items SET DEFAULT '[]'::jsonb;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not set default on items column: %', SQLERRM;
    END;
    
    -- Update NULL items to empty array
    UPDATE public.grocery_lists SET items = '[]'::jsonb WHERE items IS NULL;
  END IF;
END $$;

-- Drop and recreate the grocery_lists table with proper structure
DROP TABLE IF EXISTS public.grocery_lists CASCADE;

CREATE TABLE public.grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_grocery_list UNIQUE (user_id)
);

-- Grant necessary permissions
GRANT ALL ON TABLE public.grocery_lists TO postgres;
GRANT ALL ON TABLE public.grocery_lists TO service_role;
GRANT ALL ON TABLE public.grocery_lists TO authenticated;

-- Enable RLS
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own grocery lists"
  ON public.grocery_lists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own grocery lists"
  ON public.grocery_lists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own grocery lists"
  ON public.grocery_lists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own grocery lists"
  ON public.grocery_lists FOR DELETE
  USING (auth.uid() = user_id);

-- Create policy for service role to manage all lists
CREATE POLICY "Service role can manage all grocery lists"
  ON public.grocery_lists
  USING (auth.role() = 'service_role');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS grocery_lists_user_id_idx ON public.grocery_lists (user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_grocery_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_grocery_lists_updated_at ON public.grocery_lists;
CREATE TRIGGER update_grocery_lists_updated_at
  BEFORE UPDATE ON public.grocery_lists
  FOR EACH ROW
  EXECUTE PROCEDURE update_grocery_lists_updated_at();

-- Create a function to debug grocery list issues
CREATE OR REPLACE FUNCTION debug_grocery_list(user_id_param UUID)
RETURNS TABLE (
  "check" TEXT,
  result TEXT
) AS $$
DECLARE
  profile_tier TEXT;
  grocery_list_count INTEGER;
  user_exists BOOLEAN;
BEGIN
  -- Check if user exists
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id_param) INTO user_exists;
  "check" := 'User exists';
  result := CASE WHEN user_exists THEN 'true' ELSE 'false' END;
  RETURN NEXT;
  
  -- Check user's tier
  SELECT tier INTO profile_tier FROM profiles WHERE id = user_id_param;
  "check" := 'User tier';
  result := COALESCE(profile_tier, 'null');
  RETURN NEXT;
  
  -- Check if grocery list exists
  SELECT COUNT(*) INTO grocery_list_count FROM grocery_lists WHERE user_id = user_id_param;
  "check" := 'Grocery list count';
  result := grocery_list_count::TEXT;
  RETURN NEXT;
  
  -- Check RLS policies
  "check" := 'RLS policies';
  result := (SELECT COUNT(*)::TEXT FROM pg_policies WHERE tablename = 'grocery_lists');
  RETURN NEXT;
  
  -- Check subscription status
  "check" := 'Subscription status';
  result := (SELECT status FROM user_subscriptions WHERE user_id = user_id_param);
  RETURN NEXT;
  
  -- Check plan type
  "check" := 'Plan type';
  result := (SELECT plan_type FROM user_subscriptions WHERE user_id = user_id_param);
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql; 