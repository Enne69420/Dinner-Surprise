/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  env: {
    // Explicitly expose environment variables to client and server code
    // These will be overridden by .env.local if those values exist
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
    NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY || 'price_premium_monthly',
    NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY || 'price_premium_yearly',
    // Default URLs that will work for both local and production environments
    STRIPE_SUCCESS_URL: process.env.STRIPE_SUCCESS_URL || '/payment-success',
    STRIPE_CANCEL_URL: process.env.STRIPE_CANCEL_URL || '/payment-cancel',
    // Default empty values for optional services
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY || '',
    RESEND_API_KEY: process.env.RESEND_API_KEY || '',
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
  transpilePackages: ['context'],
  // Optimize for production builds
  poweredByHeader: false, // Remove X-Powered-By header
  reactStrictMode: true, // Enable React strict mode for improved development
  
  // Output static optimization
  output: 'standalone', // Optimize for standalone deployments like on AWS Amplify
  
  // Disable ESLint for production builds
  eslint: {
    // Warning: only disable this for production when you've addressed the issues in development
    ignoreDuringBuilds: true,
  },
  
  // Disable TypeScript type checking for builds
  typescript: {
    // !! WARN !!
    // Only use this option when you need to deploy despite TypeScript errors
    // Ideally, fix all TypeScript errors before deploying
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Customize webpack config for additional features
  webpack: (config, { isServer }) => {
    // Custom webpack config if needed
    return config;
  },
};

module.exports = nextConfig; 