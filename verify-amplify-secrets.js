/**
 * Script to verify Amplify Gen 2 secrets are properly configured
 * Run this script locally using 'amplify sandbox' to test your secrets
 */

// Import AWS SDK
const AWS = require('aws-sdk');

// Array of required secrets
const REQUIRED_SECRETS = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'DEEPSEEK_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET'
];

// Helper function to check if environment variable exists
function checkEnvVar(name) {
  const exists = !!process.env[name];
  console.log(`${name}: ${exists ? '✅ Found' : '❌ Missing'}`);
  return exists;
}

// Main verification function
async function verifySecretsConfig() {
  console.log('Verifying Amplify Gen 2 secrets configuration...\n');
  
  let allFound = true;
  
  // Check each required secret
  for (const secretName of REQUIRED_SECRETS) {
    const found = checkEnvVar(secretName);
    if (!found) allFound = false;
  }
  
  console.log('\nEnvironment Information:');
  console.log(`Node Environment: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`AWS_REGION: ${process.env.AWS_REGION || 'not set'}`);

  console.log('\nSummary:');
  if (allFound) {
    console.log('✅ All required secrets are configured correctly.');
  } else {
    console.log('❌ Some secrets are missing. Please configure them in Amplify Console.');
    console.log('See AMPLIFY-SECRETS-SETUP.md for instructions.');
  }
}

// Run the verification
verifySecretsConfig().catch(error => {
  console.error('Error during verification:', error);
  process.exit(1);
}); 