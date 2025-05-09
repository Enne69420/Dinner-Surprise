# Dinner Surprise

Dinner Surprise is a Next.js application that helps reduce food waste by generating recipes from ingredients in your kitchen, prioritizing those that will expire soon.

## Features

- Generate personalized recipes based on ingredients you have
- Track expiry dates for your grocery items
- Sort ingredients by expiry date to use them before they go bad
- Subscription plans with different feature levels
- Authentication system
- Responsive design for all devices

## Tech Stack

- **Frontend:** Next.js, TypeScript, Tailwind CSS
- **Authentication:** Supabase Auth
- **Database:** Supabase
- **API Integration:** DeepSeek API for recipe generation
- **Payments:** Stripe
- **Email:** Resend
- **Deployment:** AWS Amplify
- **Analytics:** PostHog

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/repurpose-recipes.git
   cd repurpose-recipes
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory with the following variables:
   ```
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # API Keys
   DEEPSEEK_API_KEY=your_deepseek_api_key
   
   # Stripe Configuration (must be either all test keys or all live keys)
   STRIPE_SECRET_KEY=your_stripe_secret_key                     # starts with sk_live_ or sk_test_
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key      # starts with pk_live_ or pk_test_
   STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
   
   # Stripe Product/Price IDs
   NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY=price_id_from_stripe_dashboard
   NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY=price_id_from_stripe_dashboard
   NEXT_PUBLIC_PRICE_ID_FAMILY_MONTHLY=price_id_from_stripe_dashboard
   NEXT_PUBLIC_PRICE_ID_FAMILY_YEARLY=price_id_from_stripe_dashboard
   
   # Email Configuration
   RESEND_API_KEY=your_resend_api_key
   
   # Analytics
   NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key
   ```

   > **IMPORTANT**: For Stripe keys, ensure that all keys are of the same type (all test or all live). Mixing `sk_test_` with `pk_live_` will cause payment processing errors.

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application

## Project Structure

- `/app` - Next.js app router pages
- `/components` - Reusable React components
- `/lib` - Utility functions and API clients
- `/public` - Static assets

## Deployment

The application can be deployed on AWS Amplify. Follow these steps:

1. Push your code to a GitHub repository
2. Connect your repository to AWS Amplify
3. Configure the build settings
4. Deploy the application

### AWS Amplify Gen 2 Setup

This project uses AWS Amplify Gen 2, which provides better secret management and backend capabilities:

1. **Create an Amplify app** in the AWS Console
   - Connect to your GitHub repository
   - Select "AWS Amplify Gen 2" as the build system

2. **Configure Secret Management**
   - In the Amplify console, navigate to "Hosting" → "Secret management"
   - Click on "Manage secrets" 
   - Add all sensitive API keys and secrets:
     ```
     DEEPSEEK_API_KEY
     STRIPE_SECRET_KEY
     STRIPE_WEBHOOK_SECRET
     SUPABASE_SERVICE_ROLE_KEY
     RESEND_API_KEY
     ```

3. **Configure Environment Variables**
   - In the Amplify console, go to "Hosting environments" → "Environment variables"
   - Add all public environment variables with NEXT_PUBLIC_ prefix

4. **Deploy the application**
   - Start a new build in the Amplify console
   - The backend resources will be automatically deployed during the build process

5. **Verify Backend Deployment**
   - After deployment completes, check the "Deployed backend resources" section 
   - You should see Lambda functions and API Gateway endpoints created by Amplify

For detailed setup instructions, see [AWS-AMPLIFY-SETUP.md](./AWS-AMPLIFY-SETUP.md).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Supabase for the open-source Firebase alternative
- All open-source libraries used in this project

## Stripe Setup

To set up Stripe for payments:

1. Create a Stripe account and navigate to the Developers > API Keys section
2. Get your Secret Key and Publishable Key (test or live)
3. Create Products and Prices in the Stripe dashboard
4. Copy the Price IDs for each product/price combination
5. Add all these values to your `.env.local` file
6. For webhooks, use the Stripe CLI in development or set up endpoint URLs in production

### Stripe Webhook Configuration

Webhooks are crucial for proper subscription management. They ensure your database stays in sync with Stripe, handling events like subscription cancellations, payment failures, and billing cycles.

#### Setting up webhooks in production:

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select the following events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `customer.subscription.paused`
   - `customer.subscription.resumed`
   - `customer.subscription.trial_will_end`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `invoice.upcoming`
5. Click "Add endpoint" to save
6. Copy the "Signing Secret" and add it to your environment variables as `STRIPE_WEBHOOK_SECRET`

#### Testing webhooks in development:

1. Install the [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Login to your Stripe account using the CLI:
   ```bash
   stripe login
   ```
3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
4. The CLI will output a webhook signing secret. Add this to your `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
5. In a separate terminal, you can trigger test events:
   ```bash
   stripe trigger customer.subscription.updated
   ```

#### Why webhooks are necessary:

- **Real-time updates**: When customers manage their subscriptions via Stripe's customer portal
- **Payment status tracking**: Handle successful payments, failures, and upcoming charges
- **Subscription lifecycle**: Process cancellations, pauses, and trial periods properly
- **Database consistency**: Ensure your application database reflects the accurate subscription state in Stripe

### Debugging Stripe Issues

If you encounter Stripe payment issues:

1. Check the browser console and server logs for detailed error messages
2. Verify that all environment variables are properly set
3. Ensure your API keys match (all test or all live)
4. Confirm that the Price IDs are correctly associated with your products
5. In the server logs, check that the Stripe client is initializing correctly
