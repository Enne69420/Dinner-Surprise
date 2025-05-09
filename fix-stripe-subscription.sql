-- Check if user_subscriptions table exists, if not create it
CREATE TABLE IF NOT EXISTS "public"."user_subscriptions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "subscription_id" TEXT,
    "subscription_status" TEXT NOT NULL DEFAULT 'inactive',
    "plan_type" TEXT DEFAULT 'free',
    "price_id" TEXT,
    "current_period_end" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ DEFAULT now(),
    "updated_at" TIMESTAMPTZ DEFAULT now()
);

-- Add missing columns if table already exists
DO $$
BEGIN
    -- Add stripe_subscription_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'stripe_subscription_id'
    ) THEN
        ALTER TABLE "public"."user_subscriptions" 
        ADD COLUMN "stripe_subscription_id" TEXT;
    END IF;

    -- Add subscription_id if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'subscription_id'
    ) THEN
        ALTER TABLE "public"."user_subscriptions" 
        ADD COLUMN "subscription_id" TEXT;
    END IF;

    -- Add plan_type if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_subscriptions' 
        AND column_name = 'plan_type'
    ) THEN
        ALTER TABLE "public"."user_subscriptions" 
        ADD COLUMN "plan_type" TEXT DEFAULT 'free';
    END IF;
END $$; 