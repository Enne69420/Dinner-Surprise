-- First, ensure the grocery_lists table has the right structure
CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_user_grocery_list UNIQUE (user_id)
);

-- Enable RLS on grocery_lists if not already enabled
ALTER TABLE IF EXISTS public.grocery_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for grocery_lists
DO $$ 
BEGIN
  -- Users can view their own grocery lists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'grocery_lists' AND schemaname = 'public' AND policyname = 'Users can view own grocery lists'
  ) THEN
    CREATE POLICY "Users can view own grocery lists"
      ON public.grocery_lists
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  -- Users can insert their own grocery lists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'grocery_lists' AND schemaname = 'public' AND policyname = 'Users can insert own grocery lists'
  ) THEN
    CREATE POLICY "Users can insert own grocery lists"
      ON public.grocery_lists
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- Users can update their own grocery lists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'grocery_lists' AND schemaname = 'public' AND policyname = 'Users can update own grocery lists'
  ) THEN
    CREATE POLICY "Users can update own grocery lists"
      ON public.grocery_lists
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- Users can delete their own grocery lists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'grocery_lists' AND schemaname = 'public' AND policyname = 'Users can delete own grocery lists'
  ) THEN
    CREATE POLICY "Users can delete own grocery lists"
      ON public.grocery_lists
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- For existing users with multiple grocery lists, keep the most recent one
-- First, create a temporary table with the IDs to keep
CREATE TEMP TABLE grocery_lists_to_keep AS
WITH ranked_lists AS (
  SELECT 
    id,
    user_id,
    ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY updated_at DESC) as rn
  FROM public.grocery_lists
)
SELECT id FROM ranked_lists WHERE rn = 1;

-- Delete all grocery lists except the most recent one for each user
DELETE FROM public.grocery_lists
WHERE id NOT IN (SELECT id FROM grocery_lists_to_keep);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_user_grocery_list' AND conrelid = 'public.grocery_lists'::regclass
  ) THEN
    ALTER TABLE public.grocery_lists 
    ADD CONSTRAINT unique_user_grocery_list UNIQUE (user_id);
  END IF;
END $$; 