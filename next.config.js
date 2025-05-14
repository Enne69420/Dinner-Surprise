/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    // Explicitly expose environment variables to client and server code
    // These will be overridden by .env.local if those values exist
    // STRIPE_SECRET_KEY has been removed as it should not be exposed to the client.
    // The backend function will handle Stripe API calls using the secret key securely.
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY || 'price_premium_monthly',
    NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY || 'price_premium_yearly',
    // Default URLs that will work for both local and production environments
    STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || '/payment-success',
    STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || '/payment-cancel',
    // Add NEXT_PUBLIC_BASE_URL
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000', // Default for local dev
    // Supabase variables are typically handled by Amplify's env var injection for builds
    // or .env.local for local dev, but including them here ensures they are available if directly accessed via process.env in Next.js config phase
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_AMPLIFY_API_ENDPOINT: process.env.NEXT_PUBLIC_AMPLIFY_API_ENDPOINT,
    NEXT_PUBLIC_AMPLIFY_API_KEY: process.env.NEXT_PUBLIC_AMPLIFY_API_KEY,
    NEXT_PUBLIC_AMPLIFY_REGION: process.env.NEXT_PUBLIC_AMPLIFY_REGION || 'us-east-1',
    // Default empty values for optional services
  },
  // Increase serverless function timeout for API routes that need more time
  serverRuntimeConfig: {
    maxDuration: 60, // 60 seconds
  },
  // Enable experimental features
  experimental: {
    // removed instrumentationHook as it's no longer needed
    serverActions: {
      bodySizeLimit: '2mb', // Increase limit for server action requests
    },
  },
  // Transpile certain packages to fix module resolution
  transpilePackages: [
    "@aws-amplify/backend",
    "@aws-amplify/backend-cli",
    "@aws-amplify/backend-function"
  ],
  // Optimize for production builds
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true, // Enable React strict mode for improved development
  
  // Output static optimization
  output: 'standalone', // Optimize for standalone deployments like on AWS Amplify
  
  // Disable ESLint for production builds
  eslint: {
    // Warning: only disable this for production when you've addressed the issues in development
    ignoreDuringBuilds: false, // Set to false to enforce linting during builds
  },
  
  // Disable TypeScript type checking for builds
  typescript: {
    // !! WARN !!
    // Only use this option when you need to deploy despite TypeScript errors
    // Ideally, fix all TypeScript errors before deploying
    // !! WARN !!
    ignoreBuildErrors: process.env.NODE_ENV === 'production',
  },
  
  // Customize webpack config for additional features
  webpack: (config, { isServer }) => {
    // Custom webpack config if needed
    return config;
  },
  // Don't need this when using App Router
  swcMinify: true,
};

module.exports = nextConfig; 