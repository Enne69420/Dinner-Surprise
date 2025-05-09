# Fix for "column current_period_start does not exist" Error

This document provides instructions to fix the error you're encountering with the `user_subscriptions` table.

## The Problem

You're seeing this error because the SQL scripts are trying to use a column called `current_period_start` in the `user_subscriptions` table, but this column doesn't exist in your database.

## Solution

We've created a comprehensive fix that handles this error by:

1. Checking if the column exists in the table
2. Adding the column if it doesn't exist
3. Populating the column with appropriate values
4. Ensuring future SQL scripts check for this column before using it

## How to Apply the Fix

### Option 1: Run the Complete Fix Script

1. Open the Supabase SQL Editor
2. Copy and paste the contents of `complete-subscription-fix.sql` into the editor
3. Run the script
4. This will check for and add any missing columns, then properly populate the user_subscriptions table

### Option 2: Run the Fix in Steps

If you prefer a more gradual approach or want to understand each fix:

1. First run `fix-user-subscriptions-current-period-start.sql` to add the missing column
2. Then run `fix-user-subscriptions.sql` to populate the table and apply other fixes
3. Finally run `updated-subscription-trigger.sql` to ensure future profile creations properly add subscription records

## Verifying the Fix

After running the fix, you can verify it worked with this SQL:

```sql
-- Check that current_period_start column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions';

-- Verify data in the table
SELECT 
  user_id, 
  plan_type, 
  status, 
  current_period_start, 
  current_period_end 
FROM public.user_subscriptions 
LIMIT 10;
```

## Technical Details

The error occurred because different versions of the schema were used in different places. Some SQL scripts expected a `current_period_start` column, while your actual database table didn't have this column.

The main scripts in your project that use this column are:

1. `fix-user-subscriptions.sql` - Populates the user_subscriptions table from profiles
2. `add-subscription-trigger.sql` - Creates a trigger to add subscriptions for new profiles

Both scripts have been updated to check for the column first before using it.

## Need Further Help?

If you encounter any other issues or need assistance, please reach out for additional support. 