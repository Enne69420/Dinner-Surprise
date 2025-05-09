-- Drop and recreate grocery_lists table with proper structure
DROP TABLE IF EXISTS public.grocery_lists;

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