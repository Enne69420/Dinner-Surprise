const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Make sure these are set in your environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Environment variables not found. Please follow these steps:');
  console.error('1. Create a .env.local file in the project root using sample.env.local as a template');
  console.error('2. Add your Supabase URL and service key to the file');
  console.error('3. Run the script again');
  console.error('\nAlternatively, you can sign in to your app and the application will attempt');
  console.error('to sync subscriptions automatically for your user.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // 1. Create exec_sql function
    console.log('Creating SQL execution function...');
    const execSqlPath = path.join(__dirname, 'src', 'db', 'exec-sql-function.sql');
    const execSqlContent = fs.readFileSync(execSqlPath, 'utf8');
    
    try {
      await supabase.rpc('exec_sql', { sql: execSqlContent });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('SQL execution function already exists. Continuing...');
      } else {
        // For this function, we'll create it directly
        console.log('Trying direct SQL execution...');
        const { error: directError } = await supabase.from('_exec_sql_direct').rpc(execSqlContent);
        if (directError) {
          console.error('Failed to create SQL execution function:', directError);
          console.log('Continuing anyway, but subsequent steps may fail...');
        }
      }
    }
    
    // 2. Create user_subscriptions table function
    console.log('Creating user_subscriptions table creation function...');
    const createTableFnPath = path.join(__dirname, 'src', 'db', 'create-user-subscriptions-table.sql');
    const createTableFnContent = fs.readFileSync(createTableFnPath, 'utf8');
    
    try {
      await supabase.rpc('exec_sql', { sql: createTableFnContent });
    } catch (error) {
      console.error('Failed to create table creation function:', error.message);
      console.log('Continuing to next step...');
    }
    
    // 3. Execute the function to create the user_subscriptions table
    console.log('Creating user_subscriptions table...');
    try {
      await supabase.rpc('create_user_subscriptions_table');
      console.log('User subscriptions table created or verified.');
    } catch (error) {
      console.error('Failed to create user_subscriptions table:', error.message);
      console.log('Attempting to continue...');
    }
    
    // 4. Sync subscriptions with profiles
    console.log('Syncing user subscriptions with profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, tier')
      .limit(1000);
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log(`Found ${profiles.length} user profiles to sync.`);
    let successCount = 0;
    let errorCount = 0;
    
    for (const profile of profiles) {
      try {
        // Check if subscription already exists
        const { data: existingSub, error: subError } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', profile.id)
          .maybeSingle();
        
        // If no subscription exists, create one
        if (!existingSub && (!subError || subError.code === 'PGRST116')) {
          const { error: insertError } = await supabase
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
        } else {
          console.log(`Subscription already exists for user ${profile.id}`);
        }
      } catch (err) {
        console.error(`Error processing user ${profile.id}:`, err);
        errorCount++;
      }
    }
    
    console.log('Subscription sync complete!');
    console.log(`Created ${successCount} new subscriptions.`);
    console.log(`Encountered ${errorCount} errors.`);
    console.log(`${profiles.length - successCount - errorCount} subscriptions already existed.`);
    
  } catch (error) {
    console.error('Error in database initialization:', error);
  }
}

// Run the initialization
initializeDatabase()
  .then(() => console.log('Database initialization complete!'))
  .catch(err => console.error('Database initialization failed:', err)); 