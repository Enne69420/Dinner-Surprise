# Amplify Gen 2 Setup Guide for Dinner Surprise

This guide provides detailed steps to set up the Dinner Surprise app with Amplify Gen 2, focusing on proper TypeScript-based config and secret management.

## Prerequisites

- AWS Account with appropriate permissions
- Node.js and npm installed
- AWS CLI configured with your credentials

## Step 1: Install Amplify Gen 2 CLI

```bash
npm install -g @aws-amplify/cli@latest
```

## Step 2: Initialize Amplify in Your Project

If your project isn't already set up with Amplify Gen 2:

```bash
amplify init
```

This should create the necessary files in your `amplify` directory.

## Step 3: Update Dependencies

Ensure your project has the necessary Amplify Gen 2 dependencies:

```bash
npm install @aws-amplify/backend @aws-amplify/backend-cli @aws-amplify/backend-functions
```

## Step 4: Set Up Secrets in Amplify Gen 2

1. In your Amplify CLI, create secrets:

```bash
amplify secret create SUPABASE_SERVICE_ROLE_KEY
amplify secret create DEEPSEEK_API_KEY
amplify secret create STRIPE_SECRET_KEY
amplify secret create STRIPE_WEBHOOK_SECRET
```

When prompted, enter the actual secret values.

## Step 5: Verify Your Backend Configuration

Your project should have the following structure:

```
amplify/
  backend.ts              # Main backend configuration
  functions/
    generateRecipe/
      index.ts            # Function definition with secret references
      handler.ts          # Function implementation that uses secrets
```

Ensure your `backend.ts` looks like:

```typescript
import { defineBackend } from '@aws-amplify/backend';
import { generateRecipeFunction } from './functions/generateRecipe';

export const backend = defineBackend({
  generateRecipeFunction
});
```

## Step 6: Access Secrets in Your Function

Your function should access secrets like this:

```typescript
import { env } from '@aws-amplify/backend-functions/function/generateRecipeFunction/env';

// Now you can use env.SECRET_NAME
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;
```

## Step 7: Deploy Your Backend

Deploy your Amplify Gen 2 backend:

```bash
amplify deploy
```

## Step 8: Connect to Your Frontend

In your Next.js frontend, make API calls to your Amplify function using fetch.

Example:

```typescript
const response = await fetch('/api/generate-recipe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ingredients, servings, userId }),
});
```

## TypeScript Issues and Solutions

### Import Path Errors

If you see TypeScript errors like:

```
Cannot find module '@aws-amplify/backend' or its corresponding type declarations.
```

or 

```
Cannot find module '@aws-amplify/backend-functions/function/generateRecipeFunction/env' or its corresponding type declarations.
```

Here are two approaches to solve this:

#### Solution 1: Install Type Definitions

```bash
npm install --save-dev @types/aws-amplify
```

#### Solution 2: Using process.env with a Helper Function

Instead of relying on Amplify-specific imports that may not be recognized by TypeScript, you can use a helper function approach:

```typescript
// Helper function to access environment variables safely
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`Environment variable ${name} is not set`);
    return '';
  }
  return value;
}

// Then use it like this:
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');
```

This approach works because Amplify Gen 2 injects secrets as environment variables at runtime, making them accessible via `process.env`.

## Troubleshooting

### TypeScript Import Errors

If you see errors like:

```
Cannot find module '@aws-amplify/backend' or its corresponding type declarations.
```

Make sure to:

1. Install all required dependencies
2. Run `amplify codegen` to generate proper TypeScript definitions
3. Restart your IDE/TypeScript server

### Secrets Not Available

If your function can't access secrets:

1. Verify secrets are created: `amplify secret list`
2. Ensure proper IAM permissions for your Amplify role
3. Try redeploying: `amplify deploy`

### Testing Locally

To test your function locally with secrets:

```bash
amplify sandbox
```

This starts a local development environment with access to your secrets. 