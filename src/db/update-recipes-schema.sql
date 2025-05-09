-- Update recipes table to use JSONB for ingredients
ALTER TABLE public.recipes
ALTER COLUMN ingredients TYPE JSONB USING to_jsonb(ingredients);

-- Add a comment to explain the change
COMMENT ON COLUMN public.recipes.ingredients IS 'Structured ingredients with name, amount, and unit as JSONB array';

-- Create or replace a function to ensure ingredients are stored as proper JSONB
CREATE OR REPLACE FUNCTION public.ensure_ingredients_are_jsonb()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if ingredients is not a JSONB array
  IF NOT (jsonb_typeof(NEW.ingredients) = 'array') THEN
    -- Convert text[] to JSONB if needed
    IF NEW.ingredients IS NOT NULL THEN
      NEW.ingredients := to_jsonb(NEW.ingredients);
    ELSE
      NEW.ingredients := '[]'::jsonb;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add a trigger to ensure ingredients are JSONB on insert/update
DROP TRIGGER IF EXISTS ensure_ingredients_jsonb_trigger ON public.recipes;
CREATE TRIGGER ensure_ingredients_jsonb_trigger
BEFORE INSERT OR UPDATE ON public.recipes
FOR EACH ROW
EXECUTE FUNCTION public.ensure_ingredients_are_jsonb(); 