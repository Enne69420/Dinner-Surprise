import { defineFunction } from '@aws-amplify/backend';

export const sayHello = defineFunction({
  name: 'say-hello',
  entry: './handler.ts',
  // Configure environment variables and access to secrets
  environment: {
    // Access environment variables from Amplify Console
    // These variables can be set in the Amplify Console under App settings > Environment variables
    EXAMPLE_VARIABLE: process.env.EXAMPLE_VARIABLE || 'default_value',
    // Access other AWS resources as needed
  },
  // Configure the permissions for this Lambda function
  // For more information, see: https://docs.amplify.aws/react/build-a-backend/functions/grant-access-to-other-resources/
}); 