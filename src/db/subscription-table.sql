-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "price_id" TEXT,
    "current_period_end" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Add RLS policies
ALTER TABLE "public"."user_subscriptions" ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own subscription
CREATE POLICY "Users can read their own subscription" 
ON "public"."user_subscriptions"
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow system processes to manage all subscriptions
CREATE POLICY "Service roles can manage all subscriptions" 
ON "public"."user_subscriptions"
USING (auth.role() = 'service_role');

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS "user_subscriptions_user_id_idx" ON "public"."user_subscriptions" (user_id);
CREATE INDEX IF NOT EXISTS "user_subscriptions_stripe_customer_id_idx" ON "public"."user_subscriptions" (stripe_customer_id);
CREATE INDEX IF NOT EXISTS "user_subscriptions_stripe_subscription_id_idx" ON "public"."user_subscriptions" (stripe_subscription_id);

-- Create function to update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update the 'updated_at' column
CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON "public"."user_subscriptions"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 