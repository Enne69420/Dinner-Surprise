-- Fix RLS Performance Issues in Dinner Surprise
-- This script addresses two types of performance warnings:
-- 1. Auth RLS Initialization Plan warnings - improves performance by ensuring auth functions are properly wrapped
-- 2. Multiple Permissive Policies warnings - consolidates duplicate policies for the same role/action

-- =====================================================
-- Fix 1: Auth RLS Initialization Plan Warnings
-- Replace direct auth.uid() calls with (SELECT auth.uid())
-- =====================================================

-- Fix profiles table policies
DROP POLICY "Users can view own profile" ON public.profiles;
DROP POLICY "Users can view their own profile" ON public.profiles;
DROP POLICY "Users can update own profile" ON public.profiles;
DROP POLICY "Users can update their own profile" ON public.profiles;

-- Recreate with optimized queries
CREATE POLICY "Users can view their own profile" ON public.profiles
FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING ((SELECT auth.uid()) = id) WITH CHECK ((SELECT auth.uid()) = id);

-- Fix recipes table policies
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;

DROP POLICY IF EXISTS "Users can view their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update their own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete their own recipes" ON public.recipes;

-- Recreate with optimized queries
CREATE POLICY "Users can view their own recipes" ON public.recipes
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can insert their own recipes" ON public.recipes
FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update their own recipes" ON public.recipes
FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can delete their own recipes" ON public.recipes
FOR DELETE USING (user_id = (SELECT auth.uid()));

-- Fix user_subscriptions table policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.user_subscriptions;

-- Recreate with optimized queries
CREATE POLICY "Users can view own subscriptions" ON public.user_subscriptions
FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own subscriptions" ON public.user_subscriptions
FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

-- Fix grocery_lists table policies
DROP POLICY IF EXISTS "Users can view own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can insert own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can update own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Users can delete own grocery lists" ON public.grocery_lists;
DROP POLICY IF EXISTS "Service role can manage all grocery lists" ON public.grocery_lists;

-- Recreate with optimized queries and consolidate service role access
CREATE POLICY "Users can view own grocery lists" ON public.grocery_lists
FOR SELECT USING (
  (user_id = (SELECT auth.uid())) OR 
  ((SELECT current_setting('role', true)) = 'service_role')
);

CREATE POLICY "Users can insert own grocery lists" ON public.grocery_lists
FOR INSERT WITH CHECK (
  (user_id = (SELECT auth.uid())) OR 
  ((SELECT current_setting('role', true)) = 'service_role')
);

CREATE POLICY "Users can update own grocery lists" ON public.grocery_lists
FOR UPDATE USING (
  (user_id = (SELECT auth.uid())) OR 
  ((SELECT current_setting('role', true)) = 'service_role')
) WITH CHECK (
  (user_id = (SELECT auth.uid())) OR 
  ((SELECT current_setting('role', true)) = 'service_role')
);

CREATE POLICY "Users can delete own grocery lists" ON public.grocery_lists
FOR DELETE USING (
  (user_id = (SELECT auth.uid())) OR 
  ((SELECT current_setting('role', true)) = 'service_role')
); 