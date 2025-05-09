-- Fix function search path warnings

-- Fix enforce_recipe_limits function
ALTER FUNCTION public.enforce_recipe_limits
SET search_path = 'public';

-- Fix increment_monthly_usage function
ALTER FUNCTION public.increment_monthly_usage
SET search_path = 'public';

-- Fix update_grocery_lists_updated_at function
ALTER FUNCTION public.update_grocery_lists_updated_at
SET search_path = 'public';

-- Fix update_user_subscriptions_updated_at function
ALTER FUNCTION public.update_user_subscriptions_updated_at
SET search_path = 'public';

-- Fix debug_grocery_list function
ALTER FUNCTION public.debug_grocery_list
SET search_path = 'public'; 