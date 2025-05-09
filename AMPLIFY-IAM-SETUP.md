# Amplify IAM Setup Guide

This document provides instructions for fixing the AWS Amplify build issues related to SSM parameters and app access.

## Problem Overview

Your Amplify build is failing with two main errors:
1. `!Failed to set up process.env.secrets` - Indicates the service role can't access SSM parameters
2. `🛑 Amplify AppID d2odppyr9yu5gf not found` - Indicates app ID access issues

## Solution: Update IAM Service Role Permissions

Follow these steps to update your AmplifyComputeRole-DinnerSurprise IAM role:

1. Log in to the AWS Management Console
2. Navigate to IAM → Roles
3. Search for and select `AmplifyComputeRole-DinnerSurprise`
4. Click "Add permissions" and select "Create inline policy"
5. Choose the JSON tab and paste the following policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameter",
                "ssm:GetParameters",
                "ssm:GetParametersByPath"
            ],
            "Resource": [
                "arn:aws:ssm:us-east-1:*:parameter/amplify/d2odppyr9yu5gf/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "amplify:GetApp",
                "amplify:GetBranch",
                "amplify:GetBackendEnvironment"
            ],
            "Resource": [
                "arn:aws:amplify:us-east-1:*:apps/d2odppyr9yu5gf",
                "arn:aws:amplify:us-east-1:*:apps/d2odppyr9yu5gf/branches/*",
                "arn:aws:amplify:us-east-1:*:apps/d2odppyr9yu5gf/backendenvironments/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "kms:Decrypt"
            ],
            "Resource": [
                "arn:aws:kms:us-east-1:*:key/*"
            ]
        }
    ]
}
```

6. Click "Review policy"
7. Name the policy `AmplifySSMAccessPolicy`
8. Click "Create policy"

## Alternative: Create SSM Parameters Directly

If you're still having issues, you can manually create the necessary SSM parameters:

1. Navigate to AWS Systems Manager → Parameter Store
2. Create parameters with these paths:
   - `/amplify/d2odppyr9yu5gf/main/STRIPE_SECRET_KEY` (SecureString)
   - `/amplify/d2odppyr9yu5gf/main/STRIPE_WEBHOOK_SECRET` (SecureString)
   - `/amplify/d2odppyr9yu5gf/main/DEEPSEEK_API_KEY` (SecureString)
   - `/amplify/d2odppyr9yu5gf/main/SUPABASE_SERVICE_ROLE_KEY` (SecureString)
   - `/amplify/d2odppyr9yu5gf/main/RESEND_API_KEY` (SecureString)

3. Ensure the secrets match what you've configured in Amplify's Secret Management section

## Ensuring Access to Necessary Resources

1. Make sure your Amplify app actually exists in region us-east-1
2. Verify the app ID is correct: `d2odppyr9yu5gf`
3. Check that the IAM role has permissions to access the app and related resources

After making these changes, start a new build in the Amplify Console. 