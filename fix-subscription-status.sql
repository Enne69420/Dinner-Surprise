-- Fix subscription status for existing users
-- This ensures both subscription_id and stripe_subscription_id are populated
UPDATE user_subscriptions
SET 
  subscription_id = COALESCE(subscription_id, stripe_subscription_id),
  stripe_subscription_id = COALESCE(stripe_subscription_id, subscription_id)
WHERE 
  (subscription_id IS NULL AND stripe_subscription_id IS NOT NULL) 
  OR 
  (stripe_subscription_id IS NULL AND subscription_id IS NOT NULL);

-- Fix subscription status field
-- If status is NULL but plan_type is premium, set to active
UPDATE user_subscriptions
SET 
  status = 'active'
WHERE 
  plan_type = 'premium' 
  AND (status IS NULL OR status = 'inactive')
  AND (subscription_id IS NOT NULL OR stripe_subscription_id IS NOT NULL);

-- If tier is premium in profiles but not in user_subscriptions, update it
UPDATE user_subscriptions us
SET 
  plan_type = 'premium',
  status = 'active'
FROM profiles p
WHERE 
  us.user_id = p.id
  AND p.tier = 'premium'
  AND (us.plan_type != 'premium' OR us.status != 'active');

-- Update profiles table from user_subscriptions to keep them in sync
UPDATE profiles p
SET 
  tier = us.plan_type
FROM user_subscriptions us
WHERE 
  p.id = us.user_id
  AND p.tier != us.plan_type; 