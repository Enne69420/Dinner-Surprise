/**
 * This is a sample AWS Amplify configuration file.
 * In your actual deployment with AWS Amplify Gen 2, this configuration will be
 * automatically generated during the build process and made available to your app.
 * 
 * DO NOT USE THIS FILE DIRECTLY - This is only a reference for local development.
 */

const awsConfig = {
  Auth: {
    identityPoolId: 'PLACEHOLDER_IDENTITY_POOL_ID',
    region: 'us-east-1',
    userPoolId: 'PLACEHOLDER_USER_POOL_ID',
    userPoolWebClientId: 'PLACEHOLDER_USER_POOL_CLIENT_ID'
  },
  API: {
    endpoints: [
      {
        name: 'api',
        endpoint: process.env.NEXT_PUBLIC_API_ENDPOINT || 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod'
      }
    ]
  },
  Storage: {
    AWSS3: {
      bucket: process.env.NEXT_PUBLIC_S3_BUCKET || 'your-s3-bucket',
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
    }
  }
};

export default awsConfig; 