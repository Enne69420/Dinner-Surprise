# Dinner Surprise - Hybrid Supabase/Amplify App

This is a Next.js application using both Supabase and AWS Amplify. It leverages Supabase for authentication and AWS Amplify for APIs, environment variables, and secrets.

## Architecture

The application follows a hybrid approach:

- **Supabase**: Handles authentication, user management, and session persistence
- **AWS Amplify**: Provides serverless functions, GraphQL API, and environment variable management

## Project Structure

```
├── amplify/ # Folder containing Amplify backend configuration
│   ├── data/ # Definition for data and API backend
│   │   └── resource.ts
│   ├── functions/ # Lambda functions used by the app
│   │   └── api-function/ # API function
│   │       ├── resource.ts # Function definition
│   │       └── handler.ts # Function implementation
│   ├── backend.ts # Main backend configuration
│   └── tsconfig.json # TypeScript config for backend
├── src/ # Next.js application code
│   ├── utils/
│   │   └── supabase/ # Supabase client utilities
│   │       ├── client.ts # Browser client
│   │       └── server.ts # Server client
│   ├── app/ # Next.js app directory
│   ├── components/ # React components
│   └── middleware.ts # Next.js middleware
├── next.config.js # Next.js configuration
├── amplify.yml # Amplify deployment configuration
├── package.json
└── README.md
```

## Features

- **Authentication**: User sign-up, sign-in, and sign-out functionality via Supabase
- **Data Storage**: CRUD operations for to-do items using Amplify
- **API Integration**: Serverless functions using AWS Lambda through Amplify
- **Environment Variables**: Access to environment variables and secrets through Amplify

## Environment Variables

This application requires several environment variables:

### Supabase Configuration
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous API key

### AWS Amplify Configuration
- `NEXT_PUBLIC_AMPLIFY_API_ENDPOINT`: GraphQL API endpoint
- `NEXT_PUBLIC_AMPLIFY_API_KEY`: API key for GraphQL API
- `NEXT_PUBLIC_AMPLIFY_REGION`: AWS region for Amplify (defaults to 'us-east-1')

### Lambda Function Environment Variables
- `API_KEY`: API key for external services
- `API_ENDPOINT`: Endpoint for external API calls

## Setting Up Environment Variables in AWS Amplify Console

1. Go to the AWS Amplify Console and select your app
2. Navigate to "App settings" > "Environment variables"
3. Add all the required environment variables as key-value pairs
4. Make sure to toggle "All environments" if you want variables to apply to all branches

**Important**: For sensitive values like API keys, click the "Hide from build log" option to keep them secure.

## Important Notes on Environment Variables

- For local development, set these in `.env.local` (never commit this file to Git)
- For production, set these in the Amplify Console under "App settings" > "Environment variables"
- The `.env.local` file is not accessible in the Amplify Console environment
- Access these variables in Lambda functions through `process.env`

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up your environment variables in `.env.local`
4. Start the development server:
   ```
   npm run dev
   ```

## Deploying to AWS Amplify

1. Connect your repository to AWS Amplify Console
2. Configure all required environment variables in the Amplify Console
3. Ensure your build settings in `amplify.yml` match the Amplify Gen 2 requirements
4. Deploy the application

## Troubleshooting Amplify Deployment

If you encounter the error `!Failed to set up process.env.secrets` or other environment variable issues:

1. Check if all required environment variables are set in the Amplify Console
2. Verify that the `amplify.yml` file is correctly formatted
3. Ensure you're using the correct Amplify commands for Gen 2:
   - Use `npx ampx pipeline-deploy` for CI/CD builds
   - Use `npx ampx sandbox` for local development
4. Clear the build cache and redeploy if necessary

## Credits

- Built with [Next.js](https://nextjs.org/)
- Authentication via [Supabase](https://supabase.com)
- API and functions via [AWS Amplify](https://aws.amazon.com/amplify/)
- Styling with [Tailwind CSS](https://tailwindcss.com/) 