#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local');
  process.exit(1);
}

// Create Supabase admin client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL scripts to execute
const scriptFiles = [
  'fix-all-subscription-data.sql',
  'fix-grocery-lists.sql'
];

// Helper function to execute a SQL script
async function executeScript(scriptPath) {
  console.log(`\nExecuting ${scriptPath}...`);
  
  if (!fs.existsSync(scriptPath)) {
    console.error(`Error: SQL file not found: ${scriptPath}`);
    return { success: false, error: 'File not found' };
  }
  
  const sqlScript = fs.readFileSync(scriptPath, 'utf8');
  
  // Split the SQL script into individual statements
  const statements = sqlScript
    .split(/;\s*$/m)  // Split on semicolons followed by optional whitespace at end of line
    .filter(stmt => stmt.trim().length > 0);  // Remove empty statements
  
  console.log(`Found ${statements.length} statements to execute`);
  
  let successCount = 0;
  let errorCount = 0;
  
  // Execute each statement
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i].trim();
    if (!statement) continue;
    
    try {
      console.log(`[${i + 1}/${statements.length}] Executing statement...`);
      const { error } = await supabaseAdmin.rpc('pgaudit.exec_sql', { sql: statement });
      
      if (error) {
        console.error(`Error executing statement ${i + 1}:`, error);
        errorCount++;
      } else {
        console.log(`Statement ${i + 1} executed successfully`);
        successCount++;
      }
    } catch (err) {
      console.error(`Exception executing statement ${i + 1}:`, err);
      errorCount++;
    }
  }
  
  return { 
    success: errorCount === 0,
    total: statements.length,
    successful: successCount,
    failed: errorCount
  };
}

// Function to check for issues
async function checkForIssues() {
  console.log('\nChecking for common issues...');
  
  // Check for subscription mismatches
  const { data: mismatchData, error: mismatchError } = await supabaseAdmin.rpc('get_subscription_mismatches');
  
  if (mismatchError) {
    console.error('Error checking for subscription mismatches:', mismatchError);
  } else {
    console.log(`Found ${mismatchData?.length || 0} users with mismatched subscription data`);
    
    if (mismatchData && mismatchData.length > 0) {
      console.log('Sample mismatches:');
      mismatchData.slice(0, 3).forEach(item => {
        console.log(`- User ${item.user_id}: Profile tier=${item.profile_tier}, Subscription plan=${item.subscription_plan}`);
      });
    }
  }
  
  // Check for grocery list issues
  const { data: groceryIssues, error: groceryError } = await supabaseAdmin.rpc('get_grocery_list_issues');
  
  if (groceryError) {
    console.error('Error checking for grocery list issues:', groceryError);
  } else {
    console.log(`Found ${groceryIssues?.length || 0} premium users with grocery list issues`);
    
    if (groceryIssues && groceryIssues.length > 0) {
      console.log('Sample issues:');
      groceryIssues.slice(0, 3).forEach(item => {
        console.log(`- User ${item.user_id}: ${item.issue}`);
      });
    }
  }
}

// Create the diagnostic functions in the database
async function createDiagnosticFunctions() {
  console.log('\nCreating diagnostic functions...');
  
  // Create function to check for subscription mismatches
  const subscriptionMismatchFn = `
  CREATE OR REPLACE FUNCTION get_subscription_mismatches()
  RETURNS TABLE (
    user_id UUID,
    profile_tier TEXT,
    subscription_plan TEXT
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      p.tier,
      us.plan_type
    FROM 
      profiles p
    JOIN 
      user_subscriptions us ON p.id = us.user_id
    WHERE 
      p.tier != us.plan_type;
  END;
  $$ LANGUAGE plpgsql;`;
  
  // Create function to check for grocery list issues
  const groceryListIssuesFn = `
  CREATE OR REPLACE FUNCTION get_grocery_list_issues()
  RETURNS TABLE (
    user_id UUID,
    issue TEXT
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT 
      p.id,
      CASE
        WHEN gl.id IS NULL THEN 'No grocery list found'
        WHEN gl.items IS NULL THEN 'NULL items array'
        WHEN jsonb_array_length(gl.items) = 0 THEN 'Empty items array'
        ELSE 'Other issue'
      END as issue
    FROM 
      profiles p
    LEFT JOIN 
      grocery_lists gl ON p.id = gl.user_id
    WHERE 
      p.tier = 'premium' OR p.tier = 'family';
  END;
  $$ LANGUAGE plpgsql;`;
  
  // Execute the functions
  try {
    const { error: error1 } = await supabaseAdmin.rpc('pgaudit.exec_sql', { sql: subscriptionMismatchFn });
    if (error1) {
      console.error('Error creating subscription mismatch function:', error1);
    } else {
      console.log('Created subscription mismatch function');
    }
    
    const { error: error2 } = await supabaseAdmin.rpc('pgaudit.exec_sql', { sql: groceryListIssuesFn });
    if (error2) {
      console.error('Error creating grocery list issues function:', error2);
    } else {
      console.log('Created grocery list issues function');
    }
  } catch (err) {
    console.error('Exception creating diagnostic functions:', err);
  }
}

// Main function
async function main() {
  console.log('Starting database fix script...');
  
  // Create diagnostic functions
  await createDiagnosticFunctions();
  
  // Check for issues before fixing
  await checkForIssues();
  
  // Execute all scripts
  const results = [];
  
  for (const scriptFile of scriptFiles) {
    const scriptPath = path.resolve(process.cwd(), scriptFile);
    const result = await executeScript(scriptPath);
    results.push({ 
      file: scriptFile, 
      ...result 
    });
  }
  
  // Check for issues after fixing
  await checkForIssues();
  
  // Print summary
  console.log('\n=== Summary ===');
  results.forEach(result => {
    console.log(`${result.file}: ${result.success ? 'SUCCESS' : 'FAILED'} (${result.successful}/${result.total} statements)`);
  });
  
  // Exit with error code if any script failed
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

main().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
}); 