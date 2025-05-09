# AWS Amplify Gen 2 Setup Guide

This guide provides detailed instructions for deploying the Dinner Surprise application using AWS Amplify Gen 2, which offers improved environment variable handling and secret management.

## Overview

The Dinner Surprise application uses AWS Amplify Gen 2 for deployment and secret management. With this setup:

1. Secrets are stored in the **Secret management** section of the AWS Amplify Console
2. Backend resources are automatically deployed when building the application
3. APIs and other backend services are accessible through the AWS Parameter Store

## Prerequisites

- An AWS account
- A GitHub repository with your project code
- Administrator access to create AWS resources

## Step 1: Create an AWS Amplify App

1. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)
2. Click "New app" and select "Host web app"
3. Choose GitHub as your repository provider and authorize AWS Amplify
4. Select your repository and branch
5. **Important:** On the build settings page, look for the "App build version" option and select "AWS Amplify Gen 2 (Latest)"
6. Click "Next" and then "Save and deploy"

## Step 2: Configure Secret Management

Secrets are now stored in the **Secret management** section of AWS Amplify Console, not just as environment variables:

1. In your Amplify app, go to the left sidebar and click on "Hosting" -> "Secret management"
2. Click on "Manage secrets"
3. Add the following secrets:
   - `DEEPSEEK_API_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RESEND_API_KEY`

These secrets will be available at runtime through the application's backend.

## Step 3: Configure Public Environment Variables

For variables that need to be accessible at build time:

1. In your Amplify app, go to "Hosting environments"
2. Select your branch
3. Go to the "Environment variables" tab
4. Add the following variables:
   - `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY`
   - `NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY`
   - `NEXT_PUBLIC_POSTHOG_KEY`
   - `NEXT_PUBLIC_API_ENDPOINT` (Your API Gateway endpoint - will be available after first deployment)
   - `NEXT_PUBLIC_AWS_REGION` (The AWS region of your resources, e.g., 'us-east-1')

## Step 4: Deploy Your Application

1. Click on "Deploy" to build and deploy your application
2. The backend resources will be automatically created as part of the build process
3. Once deployment is complete, you'll see a "Deployed backend resources" section in the Amplify Console

## Step 5: Verify Backend Resources

After deployment:

1. Go to the "Hosting" section in the Amplify Console
2. Look for "Deployed backend resources" section
3. You should see the Lambda function, API Gateway, and other resources created by Amplify

## Accessing Secrets in Your Application

The application is configured to access secrets in two ways:

1. **For frontend**: Public variables (`NEXT_PUBLIC_*`) are injected during build time
2. **For backend Lambda functions**: Secret values are accessed through AWS Parameter Store

Inside your Lambda function, secrets can be accessed using the AWS SSM Parameter Store:

```javascript
const AWS = require('aws-sdk');
const ssm = new AWS.SSM();

async function getSecret(name) {
  const parameter = await ssm.getParameter({
    Name: `/amplify/app/prod/${name}`,
    WithDecryption: true
  }).promise();
  
  return parameter.Parameter.Value;
}

// Example:
const stripeSecretKey = await getSecret('STRIPE_SECRET_KEY');
```

## Troubleshooting

If you encounter issues with secret management:

1. **Check access permissions**: Ensure your Lambda function has the IAM permissions to access Parameter Store
2. **Verify secret names**: Make sure the secret names match exactly what's in the Secret management console
3. **Check for errors in CloudWatch**: Lambda execution errors will be logged in CloudWatch

## Project Structure

The project has been configured with the following Amplify structure:

```
/amplify
  /backend
    /function
      /dinnerSurpriseFunction
        /src
          index.js
          package.json
    backend-config.json
    team-provider-info.json
    types/
  team-provider-info.json
```

This structure ensures that the backend resources are properly deployed when you build your application in AWS Amplify Gen 2.

## Additional Resources

- [AWS Amplify Gen 2 Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/build-settings.html)
- [AWS Parameter Store Documentation](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Amplify Secrets and Environment Vars](https://docs.amplify.aws/react/build-a-backend/functions/environment-variables-and-secrets/) 