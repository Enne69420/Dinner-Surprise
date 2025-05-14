import { defineAuth } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    // Disabling phone login
    phone: undefined,
  },
  multifactor: {
    mode: 'OFF',
  },
  userAttributes: {
    // Define custom attributes for users
    givenName: {
      required: false,
      mutable: true,
    },
    familyName: {
      required: false,
      mutable: true,
    },
  },
  // Access environment variables securely through the Amplify console
  // In production, these will be available from the Amplify console
  // You can set these by choosing "Environment variables" in the "App settings" section
  // of your app in the Amplify console
  passwordPolicy: {
    // Using environment variables for password policy - these will be set in Amplify Console
    minLength: process.env.PASSWORD_MIN_LENGTH ? parseInt(process.env.PASSWORD_MIN_LENGTH) : 8,
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialCharacters: true,
  },
  // For more advanced customizations, see https://docs.amplify.aws/react/build-a-backend/auth/set-up-auth/
  // Note: Define verification messages for email
  verification: {
    email: {
      body: {
        // Access environment variables for customized messages
        html: process.env.EMAIL_VERIFICATION_HTML,
      }
    }
  }
}); 