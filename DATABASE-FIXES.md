# Database Fixes for Dinner Surprise

This document explains how to fix subscription and grocery list issues in the Dinner Surprise application.

## Issues Addressed

1. **Subscription Table Synchronization**
   - Mismatches between `profiles.tier` and `user_subscriptions.plan_type`
   - Missing or NULL fields in `user_subscriptions` table
   - Missing records in `user_subscriptions` for existing users
   - Inconsistencies between `subscription_id` and `stripe_subscription_id`

2. **Grocery List Persistence**
   - Grocery lists not properly saved for premium users
   - Loading issues with grocery lists
   - Incorrect database structure for grocery lists
   - Permissions issues with grocery lists table

3. **Database Performance Issues**
   - RLS performance problems causing query slowdowns
   - Redundant policy checks affecting all database operations
   - Inefficient auth function evaluation in RLS policies
   - Excessive duplicate permissive policies on tables

## Fix Scripts

### 1. Fix All Subscription Data

The `fix-all-subscription-data.sql` script:

- Ensures all required columns exist in the `user_subscriptions` table
- Populates NULL values with appropriate defaults
- Creates subscription records for all users who don't have one
- Sets placeholder values for subscription IDs for premium users
- Ensures subscription status is correct based on plan type
- Synchronizes data between `profiles` and `user_subscriptions` tables
- Adds proper constraints and triggers

### 2. Fix Grocery Lists

The `fix-grocery-lists.sql` script:

- Recreates the `grocery_lists` table with proper structure
- Sets up required constraints and indexes
- Establishes proper Row Level Security (RLS) policies
- Creates a trigger for automatic timestamp updates
- Provides a diagnostic function to troubleshoot grocery list issues

### 3. Fix RLS Performance Issues

The `fix-rls-performance.sql` script:

- Addresses Supabase database performance warnings
- Fixes `auth_rls_initplan` warnings by properly wrapping auth functions in SELECT statements
- Consolidates duplicate RLS policies to eliminate `multiple_permissive_policies` warnings
- Optimizes policy execution for better performance at scale
- Improves query performance for tables with RLS enabled

## Database Performance Analysis

Based on performance metrics analysis, we've identified several key areas for improvement:

1. **Most Time-Consuming Queries**
   - Table schema queries consuming 30.3% of database time
   - Timezone name queries consuming 16.4% of database time
   - Function definition queries consuming 16.0% of database time
   - These are primarily administrative queries from the Supabase dashboard

2. **RLS Policy Impact**
   - Row-level security policies are re-evaluating auth functions for every row
   - Multiple identical policies for the same roles and actions are creating redundant checks
   - Each policy is being executed independently, multiplying the workload

3. **Optimization Strategy**
   - Wrapped all auth function calls in SELECT statements to prevent re-evaluation
   - Consolidated duplicate policies to reduce redundant checks
   - Added IF EXISTS to policy drops to make the script more robust
   - Avoided WITH CHECK clauses on SELECT and DELETE policies (which caused SQL errors)
   - Combined service role access into user policies to reduce policy count

## How to Run the Fixes

### Method 1: Automatic Fix Script

Run the provided Node.js script to fix all issues automatically:

```bash
# Install dependencies first
npm install dotenv @supabase/supabase-js

# Make sure your .env.local file has Supabase credentials
# Then run the fix script
node fix-all-issues.js
```

The script will:
1. Create diagnostic functions in the database
2. Check for issues before fixing
3. Run both fix scripts
4. Verify if the fixes resolved the issues

### Method 2: Run SQL Scripts Manually

You can run each SQL script manually using the Supabase SQL editor:

1. Navigate to your Supabase project dashboard
2. Click on "SQL Editor"
3. Create a new query
4. Copy and paste the contents of each script
5. Execute the scripts one at a time

## Troubleshooting Specific Users

For diagnosing issues with specific users, we've created an admin troubleshooting interface:

1. Navigate to `/admin/troubleshoot` in the application
2. Enter the user ID of the affected user
3. The diagnostic tool will show:
   - Profile information including tier
   - Subscription details including status and IDs
   - Grocery list information and any errors
   - Recommendations for fixing the issues

You can also use the diagnostic API endpoint directly:
```
GET /api/debug/grocery-list?userId=YOUR_USER_ID
```

## Post-Fix Verification

After applying the fixes, verify that:

1. The `profiles.tier` and `user_subscriptions.plan_type` fields match for all users
2. All premium users have the required fields populated in `user_subscriptions`
3. Premium users can successfully save and load their grocery lists
4. The grocery list appears correctly on the grocery list page
5. Database performance has improved, especially for operations with RLS policies

## Maintenance

To prevent these issues from recurring:

1. Use the `updateUserSubscriptionStatus()` utility function in `src/utils/transaction.ts` whenever updating subscription status
2. This function ensures both tables are updated in a synchronized manner
3. Always check both `subscription_id` and `stripe_subscription_id` fields
4. Ensure proper error handling in the grocery list API
5. Periodically review database performance metrics for potential optimizations

## Future Improvements

Consider implementing these additional improvements:

1. Regular database health checks to detect and fix similar issues
2. Better logging for subscription and grocery list operations
3. More robust error handling in the client code
4. Automated tests for the subscription and grocery list functionality
5. Database query caching strategy for frequently accessed data
6. Simplify complex queries that are consuming significant database time

## Performance Optimizations

We've implemented several performance optimizations to reduce excessive API calls and improve the application's responsiveness:

1. **Debounced Grocery List Saving**
   - Added a 1-second debounce to prevent multiple rapid save operations
   - Implemented change detection to avoid unnecessary saves when data hasn't changed
   - Improved localStorage handling for free users

2. **Reduced Logging**
   - Removed excessive console logging from API endpoints
   - Only critical errors are now logged to the console
   - Terminal output is now much cleaner and easier to read

3. **Database Query Optimization**
   - Optimized RLS policies to prevent unnecessary re-evaluation
   - Consolidated duplicate policies to reduce redundant checks
   - Improved auth function handling in security policies

## Security Fixes

We've addressed several security warnings in the database:

1. **Function Search Path** 
   - Fixed the search path for multiple database functions 
   - This prevents potential SQL injection or privilege escalation attacks
   - Applied to the following functions:
     - `enforce_recipe_limits`
     - `increment_monthly_usage`
     - `update_grocery_lists_updated_at`
     - `update_user_subscriptions_updated_at`
     - `debug_grocery_list`

2. **Password Protection**
   - Added guidance to ensure leaked password protection is enabled in Supabase

3. **RLS Performance Optimizations**
   - Fixed `auth_rls_initplan` warnings by properly wrapping auth functions
   - Consolidated duplicate permissive policies
   - These changes improve query performance and reduce security risks
   - Tables fixed:
     - `profiles`
     - `recipes`
     - `user_subscriptions`
     - `grocery_lists`

Run the provided `fix-function-security.sql` and `fix-rls-performance.sql` scripts to fix the security warnings. 