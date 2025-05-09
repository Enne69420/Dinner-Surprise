/**
 * Script for loading secrets during the build process
 * This helps bypass the need for SSM when the service role doesn't have permissions
 */

const fs = require('fs');

// Create environment variables for the Lambda function
const createEnvFile = () => {
  try {
    let envContent = '';
    
    // Secrets from environment variables - these should be set in Amplify Console environment variables
    const secretKeys = [
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'DEEPSEEK_API_KEY',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];
    
    // Add each secret to the env file if it exists in the environment
    secretKeys.forEach(key => {
      if (process.env[key]) {
        envContent += `${key}=${process.env[key]}\n`;
      }
    });
    
    // Add the skip app ID mismatch check variable
    envContent += 'AMPLIFY_SKIP_APP_ID_MISMATCH_CHECK=true\n';
    
    // Write to .env file in the function directory
    fs.writeFileSync('./function/.env', envContent);
    console.log('Successfully created function environment file');
    
    return true;
  } catch (error) {
    console.error('Error creating environment file:', error);
    return false;
  }
};

// Run the main function
createEnvFile(); 