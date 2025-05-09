-- Function to create user_subscriptions table if it doesn't exist
CREATE OR REPLACE FUNCTION create_user_subscriptions_table()
RETURNS void AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_subscriptions'
  ) THEN
    -- Create the user_subscriptions table
    CREATE TABLE public.user_subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      subscription_id TEXT,
      stripe_subscription_id TEXT,
      stripe_customer_id TEXT,
      plan_type TEXT NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'premium', 'family')),
      price_id TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      current_period_start TIMESTAMPTZ,
      current_period_end TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Create indexes for faster lookups
    CREATE INDEX idx_user_subscriptions_user_id ON public.user_subscriptions(user_id);
    CREATE INDEX idx_user_subscriptions_subscription_id ON public.user_subscriptions(subscription_id);
    CREATE INDEX idx_user_subscriptions_stripe_customer_id ON public.user_subscriptions(stripe_customer_id);

    -- Set up RLS (Row Level Security)
    ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

    -- Create policies for RLS
    -- 1. Users can read their own subscription data
    CREATE POLICY "Users can read their own subscription data"
      ON public.user_subscriptions
      FOR SELECT
      USING (auth.uid() = user_id);

    -- 2. Service role can manage all subscription data
    CREATE POLICY "Service role can manage all subscription data"
      ON public.user_subscriptions
      USING (true)
      WITH CHECK (true);
  END IF;
END;
$$ LANGUAGE plpgsql; 