import { createClient } from '@supabase/supabase-js';

// Create admin client for direct database updates
const getAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
};

/**
 * Update user subscription status across all tables to ensure consistency.
 * 
 * @param userId The user ID
 * @param planType The plan type to set (free, premium, etc.)
 * @param subscriptionData Additional subscription data to update
 * @returns An object with the success status and any errors
 */
export async function updateUserSubscriptionStatus(
  userId: string,
  planType: string,
  subscriptionData: Record<string, any> = {}
): Promise<{ success: boolean; errors?: any[] }> {
  const supabaseAdmin = getAdminClient();
  const timestamp = new Date().toISOString();
  const errors = [];
  
  try {
    // IMPORTANT: Update both tables to ensure consistency
    
    // 1. Update the profiles table first
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        tier: planType, // Set tier to match the plan type
        updated_at: timestamp
      })
      .eq('id', userId);
      
    if (profileError) {
      console.error('Error updating profile tier:', profileError);
      errors.push({ table: 'profiles', error: profileError });
    } else {
      console.log(`Successfully updated profile.tier to '${planType}' for user ${userId}`);
    }
    
    // 2. Check if user_subscription record exists
    const { data: existingSub, error: checkError } = await supabaseAdmin
      .from('user_subscriptions')
      .select('id, plan_type, status')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing subscription:', checkError);
      errors.push({ table: 'user_subscriptions', error: checkError, operation: 'check' });
    }
    
    // For debugging
    if (existingSub) {
      console.log(`Existing subscription found for user ${userId}: plan_type=${existingSub.plan_type}, status=${existingSub.status}`);
    } else {
      console.log(`No existing subscription found for user ${userId}, will create new record`);
    }
    
    // Default subscription data to update
    const subscriptionUpdate = {
      plan_type: planType, // IMPORTANT: always set plan_type to match planType parameter
      updated_at: timestamp,
      ...subscriptionData
    };
    
    if (existingSub) {
      // Update existing subscription
      const { error: updateError } = await supabaseAdmin
        .from('user_subscriptions')
        .update(subscriptionUpdate)
        .eq('user_id', userId);
        
      if (updateError) {
        console.error('Error updating user_subscriptions:', updateError);
        errors.push({ table: 'user_subscriptions', error: updateError, operation: 'update' });
      } else {
        console.log(`Successfully updated user_subscriptions.plan_type to '${planType}' for user ${userId}`);
      }
    } else {
      // Create new subscription record
      const insertData = {
        user_id: userId,
        plan_type: planType, // IMPORTANT: always set plan_type to match planType parameter
        status: planType === 'free' ? 'inactive' : 'active', // Set appropriate status
        created_at: timestamp,
        updated_at: timestamp,
        ...subscriptionData
      };
      
      const { error: insertError } = await supabaseAdmin
        .from('user_subscriptions')
        .insert(insertData);
        
      if (insertError) {
        console.error('Error creating user_subscriptions:', insertError);
        errors.push({ table: 'user_subscriptions', error: insertError, operation: 'insert' });
      } else {
        console.log(`Successfully created new user_subscriptions record with plan_type='${planType}' for user ${userId}`);
      }
    }
    
    return { 
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error('Error in updateUserSubscriptionStatus:', error);
    return { 
      success: false, 
      errors: [{ general: error }] 
    };
  }
} 