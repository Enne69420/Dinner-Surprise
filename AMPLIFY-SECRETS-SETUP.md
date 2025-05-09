# Setting Up Secrets in Amplify Gen 2 Console

This project uses Amplify Gen 2 for deployment and secret management. Follow these steps to ensure your secrets are correctly configured.

## Required Secrets

The following secrets must be configured in Amplify Console:

1. `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
2. `DEEPSEEK_API_KEY` - DeepSeek API key for AI functions
3. `STRIPE_SECRET_KEY` - Stripe secret key for payment processing
4. `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret for event handling

## Steps to Configure Secrets in Amplify Console

1. Navigate to the AWS Amplify Console
2. Select your app from the list
3. In the left sidebar, click on "Environment variables"
4. Choose the "Secret values" tab
5. For each required secret:
   - Click "Add secret"
   - Enter the name exactly as listed above
   - Enter the secret value
   - Click "Save"

## Important Notes

- Secrets are passed to your functions automatically at runtime
- Never store secrets in code or commit them to version control
- Secrets can be accessed directly via `process.env` in Lambda functions
- Changes to secrets require redeployment to take effect

## Verifying Secrets Are Set Correctly

To verify that your secrets are set correctly:

1. Deploy your app: `amplify deploy`
2. Test the functionality that uses secrets
3. Check logs for any environment variable errors

If you see errors like "Environment variable X is not set", it means the secret wasn't properly configured.

## Local Development

For local development, you can use:

```bash
amplify sandbox
```

This will provide a local environment with access to your secrets.

Alternatively, create a `.env.local` file (not committed to Git) with your development values. 