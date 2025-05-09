import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SubscriptionResponse } from '@/types/subscription';
import { cookies } from 'next/headers';

// Initialize Supabase client with service role key for admin operations
const serviceRoleSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering to always get fresh data
export const dynamic = 'force-dynamic';

/**
 * API endpoint to synchronize user subscriptions between profiles and user_subscriptions tables
 * This ensures that billing information is correctly reflected in both places
 */
export async function POST(req: NextRequest): Promise<NextResponse<SubscriptionResponse>> {
  try {
    // Check for both cookie-based and Authorization header auth
    let session = null;
    let user = null;
    
    // Try to get auth from cookies first
    const cookieStore = cookies();
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            cookie: req.headers.get('cookie') || ''
          }
        },
        auth: {
          persistSession: false,
          detectSessionInUrl: false,
          autoRefreshToken: false,
        }
      }
    );
    
    // Get session from cookies
    const { data: sessionData, error: cookieAuthError } = await supabaseClient.auth.getSession();
    if (sessionData?.session) {
      session = sessionData.session;
      user = session.user;
    }
    
    // If cookie auth failed, try Bearer token auth
    if (!session) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        // Verify the token
        const { data: authData, error: tokenAuthError } = await supabaseClient.auth.getUser(token);
        if (!tokenAuthError && authData?.user) {
          user = authData.user;
        } else {
          console.error('Token auth error:', tokenAuthError);
        }
      }
    }
    
    // If both auth methods failed, return 401
    if (!user) {
      console.error('Auth error: No valid session or token found');
      return NextResponse.json({ 
        success: false,
        error: 'Authentication failed' 
      }, { status: 401 });
    }
    
    const { userId } = await req.json();

    // Verify that the userId matches the authenticated user
    if (userId !== user.id) {
      return NextResponse.json({ 
        success: false,
        error: 'User ID mismatch' 
      }, { status: 403 });
    }

    // Get the user's profile
    const { data: profile, error: profileError } = await serviceRoleSupabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch user profile' 
      }, { status: 500 });
    }

    // Check if user has a subscription record
    const { data: existingSubscription, error: subError } = await serviceRoleSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    // If no subscription record, create one based on profile data
    if (!existingSubscription) {
      const { error: createError } = await serviceRoleSupabase
        .from('user_subscriptions')
        .insert({
          user_id: userId,
          plan_type: profile.tier || 'free',
          status: 'active',
          current_period_start: profile.created_at || new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      
      if (createError) {
        console.error('Error creating subscription record:', createError);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to create subscription record' 
        }, { status: 500 });
      }
    }
    // If subscription exists but doesn't match profile tier, update it
    else if (existingSubscription && existingSubscription.plan_type !== profile.tier) {
      const { error: updateError } = await serviceRoleSupabase
        .from('user_subscriptions')
        .update({ 
          plan_type: profile.tier,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
      
      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to update subscription record' 
        }, { status: 500 });
      }
    }
    
    // Return success with the subscription data
    const { data: subscription, error: fetchError } = await serviceRoleSupabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated subscription:', fetchError);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch updated subscription' 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      subscription
    });
    
  } catch (error: any) {
    console.error('Error in sync subscription:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to sync subscription: ' + (error.message || 'Unknown error') 
      },
      { status: 500 }
    );
  }
} 