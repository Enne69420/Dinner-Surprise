import { defineFunction } from '@aws-amplify/backend';

export const apiFunction = defineFunction({
  name: 'api-function',
  entry: './handler.ts',
  // Access environment variables and secrets
  environment: {
    // Example of accessing environment variables - these will be set in Amplify Console
    API_KEY: process.env.API_KEY || '',
    API_ENDPOINT: process.env.API_ENDPOINT || '',
    // You can reference other environment variables needed for your APIs here
  },
  // Configure permissions as needed for your API function
  // For more info, see: https://docs.amplify.aws/react/build-a-backend/functions/grant-access-to-other-resources/
}); 