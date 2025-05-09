# Amplify Gen 2 Setup Guide for Dinner Surprise

This guide provides detailed steps to set up your app with Amplify Gen 2, focusing on proper secret management.

## Step 1: Set up IAM Permissions

Before deploying, ensure your Amplify service role has the necessary permissions:

1. Log in to the AWS Management Console
2. Navigate to IAM → Roles
3. Search for and select `AmplifyComputeRole-DinnerSurprise`
4. Click "Add permissions" and select "Create inline policy"
5. Choose the JSON tab and paste the contents of the `amplify-ssm-access-policy.json` file
6. Name the policy `AmplifySSMSecretAccess` and click "Create policy"

## Step 2: Configure Secrets in Amplify Console

1. Go to the [AWS Amplify Console](https://console.aws.amazon.com/amplify/home)
2. Select your app (App ID: dyapawq5wdyx3)
3. In the left navigation, go to "Hosting environments" → select your branch
4. Go to the "Environment variables" tab
5. Add these public environment variables:
   - `NEXT_PUBLIC_BASE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY`
   - `NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY`
   - `NEXT_PUBLIC_AWS_REGION` (set to "us-east-1")
   - `NEXT_PUBLIC_API_ENDPOINT`

## Step 3: Set up Secrets

1. In the Amplify Console, navigate to "Hosting" → "Secret management"
2. Click "Manage secrets"
3. Add the following secrets:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `DEEPSEEK_API_KEY`

These secrets will be stored in AWS Systems Manager Parameter Store with the path format:
`/amplify/dyapawq5wdyx3/SECRET_NAME`

## Step 4: Verify SSM Parameter Store

Ensure the secrets are properly set up in SSM Parameter Store:

1. Go to AWS Systems Manager → Parameter Store
2. Verify that parameters exist with these paths:
   - `/amplify/dyapawq5wdyx3/SUPABASE_SERVICE_ROLE_KEY`
   - `/amplify/dyapawq5wdyx3/STRIPE_SECRET_KEY`
   - `/amplify/dyapawq5wdyx3/STRIPE_WEBHOOK_SECRET`
   - `/amplify/dyapawq5wdyx3/DEEPSEEK_API_KEY`

## Step 5: Deploy Your Application

1. Click "Save" to save your environment variables and secrets
2. Go back to your app's main page and click "Redeploy this version" to start a new build
3. Monitor the build logs to ensure secrets are being properly accessed

## Troubleshooting

If you encounter errors related to accessing secrets:

1. **Check IAM Permissions**: Verify that the `AmplifyComputeRole-DinnerSurprise` role has the necessary permissions to access SSM parameters and KMS for decryption.

2. **Verify Secret Path**: Make sure your secrets are stored with the correct path format in SSM Parameter Store.

3. **Check Build Logs**: In the build logs, look for lines indicating successful retrieval of secrets.

4. **Manual Parameter Creation**: If necessary, manually create the parameters in SSM Parameter Store following the path pattern `/amplify/dyapawq5wdyx3/SECRET_NAME`.

## References

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Environment Variables and Secrets in Amplify](https://docs.amplify.aws/nextjs/build-a-backend/) 