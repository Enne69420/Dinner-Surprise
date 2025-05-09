import { Amplify } from 'aws-amplify';

// Configure Amplify
export function configureAmplify() {
  Amplify.configure({
    // AWS resources configuration from amplify outputs will be automatically
    // added during deployment in AWS Amplify Gen 2

    Auth: {
      // We're using Supabase Auth, so leave this section minimal
      // This is required to prevent Amplify errors
      Cognito: {
        userPoolClientId: 'placeholder',
        userPoolId: 'placeholder',
      }
    },
    API: {
      REST: {
        // Backend API endpoints will be added here during deployment
        health: {
          endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || 'http://localhost:3000',
          region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
        }
      }
    },
    Storage: {
      S3: {
        bucket: process.env.NEXT_PUBLIC_S3_BUCKET || 'your-bucket-name',
        region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
      }
    }
  });
} 