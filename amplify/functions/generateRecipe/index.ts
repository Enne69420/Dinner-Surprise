import { defineFunction, secret } from '@aws-amplify/backend';

/**
 * Define the Amplify Gen 2 function with secure access to secrets
 * This function will handle recipe generation with proper secret management
 */
export const generateRecipeFunction = defineFunction({
  name: 'generateRecipeFunction',
  // Define the function's environment variables, including secrets
  environment: {
    // Use secret() for sensitive values
    SUPABASE_SERVICE_ROLE_KEY: secret('SUPABASE_SERVICE_ROLE_KEY'),
    DEEPSEEK_API_KEY: secret('DEEPSEEK_API_KEY'),
    STRIPE_SECRET_KEY: secret('STRIPE_SECRET_KEY'),
    STRIPE_WEBHOOK_SECRET: secret('STRIPE_WEBHOOK_SECRET'),
    // Regular environment variables set by Amplify (provide placeholders or defaults here)
    NEXT_PUBLIC_SUPABASE_URL: 'YOUR_SUPABASE_URL_HERE', // Placeholder, will be overridden by Amplify env var
    NODE_ENV: 'development', // Default, will be overridden by Amplify env var for different environments
    NEXT_PUBLIC_BASE_URL: 'YOUR_BASE_URL_HERE' // Placeholder for base URL
  },
}); 