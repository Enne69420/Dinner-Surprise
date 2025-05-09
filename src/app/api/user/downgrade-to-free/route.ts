import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { updateUserSubscriptionStatus } from '@/utils/transaction';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Get user ID from request body
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabaseAdmin
      .from('profiles')
      .select('id, tier')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error finding user:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update both tables to set the user to free tier
    const result = await updateUserSubscriptionStatus(userId, 'free', {
      status: 'inactive',
      // Keep existing subscription IDs for history
      updated_at: new Date().toISOString()
    });

    if (!result.success) {
      console.error('Error downgrading subscription:', result.errors);
      return NextResponse.json({ 
        error: 'Failed to downgrade subscription', 
        details: result.errors 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Successfully downgraded to free plan'
    });
  } catch (error: any) {
    console.error('Error in downgrade-to-free:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
} 