import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase admin client
const serviceRoleSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // Check for authorization
    const authHeader = req.headers.get('authorization');
    const adminKey = process.env.ADMIN_API_KEY;
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Read the SQL file
    const sqlFilePath = path.join(process.cwd(), 'src', 'db', 'create-user-subscriptions-table.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL to create the function
    const { error: functionError } = await serviceRoleSupabase.rpc('exec_sql', { 
      sql: sqlContent 
    });
    
    if (functionError) {
      console.error('Error creating function:', functionError);
      // If the error indicates the function already exists, continue
      if (!functionError.message.includes('already exists')) {
        return NextResponse.json({ error: 'Failed to create function' }, { status: 500 });
      }
    }
    
    // Call the function to create the table
    const { error: tableError } = await serviceRoleSupabase.rpc('create_user_subscriptions_table');
    
    if (tableError) {
      console.error('Error creating table:', tableError);
      return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
    }
    
    // Sync existing user profiles with the user_subscriptions table
    const { data: profiles, error: profilesError } = await serviceRoleSupabase
      .from('profiles')
      .select('id, tier')
      .limit(1000);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
    
    let successCount = 0;
    let errorCount = 0;
    
    // For each profile, create a subscription record if one doesn't exist
    for (const profile of profiles) {
      try {
        // Check if subscription already exists
        const { data: existingSub, error: subError } = await serviceRoleSupabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();
        
        // If no subscription exists, create one
        if (!existingSub && (!subError || subError.code === 'PGRST116')) {
          const { error: insertError } = await serviceRoleSupabase
            .from('user_subscriptions')
            .insert({
              user_id: profile.id,
              plan_type: profile.tier || 'free',
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          
          if (insertError) {
            console.error(`Error creating subscription for user ${profile.id}:`, insertError);
            errorCount++;
          } else {
            successCount++;
          }
        }
      } catch (err) {
        console.error(`Error processing user ${profile.id}:`, err);
        errorCount++;
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'User subscription table initialized',
      details: {
        successCount,
        errorCount,
        totalProfiles: profiles.length
      }
    });
    
  } catch (error: any) {
    console.error('Error in db init:', error);
    return NextResponse.json(
      { error: 'Failed to initialize database: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
} 