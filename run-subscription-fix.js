/**
 * Run this script to fix subscription data issues
 * 
 * Usage: node run-subscription-fix.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.blue}=== Dinner Surprise Subscription Data Fixer ===${colors.reset}`);
console.log(`${colors.yellow}This script will fix subscription data issues by running SQL scripts.${colors.reset}\n`);

// Get the database connection string
const getDatabaseUrl = () => {
  // First try to get from .env.local
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
      if (match && match[1]) {
        console.log(`${colors.green}Found Supabase URL in .env.local${colors.reset}`);
        return match[1].trim();
      }
    }
  } catch (error) {
    console.error(`${colors.red}Error reading .env.local:${colors.reset}`, error);
  }
  
  // Fall back to asking the user
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    readline.question(`${colors.yellow}Enter your Supabase database URL:${colors.reset} `, (url) => {
      readline.close();
      resolve(url.trim());
    });
  });
};

// Main function
async function main() {
  try {
    // Run the fix scripts in sequence
    console.log(`${colors.cyan}Running fix-user-subscriptions.sql...${colors.reset}`);
    execSync('psql -d your_database_url -f fix-user-subscriptions.sql', { stdio: 'inherit' });
    
    console.log(`${colors.cyan}Running fix-subscription-sync.sql...${colors.reset}`);
    execSync('psql -d your_database_url -f fix-subscription-sync.sql', { stdio: 'inherit' });
    
    console.log(`${colors.cyan}Running fix-subscription-status.sql...${colors.reset}`);
    execSync('psql -d your_database_url -f fix-subscription-status.sql', { stdio: 'inherit' });
    
    console.log(`${colors.green}All subscription fixes have been applied successfully!${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error running SQL scripts:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error); 