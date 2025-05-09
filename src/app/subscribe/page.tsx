'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  PaymentElement, 
  useStripe, 
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';
import { getStripePriceIds, getStripePublishableKey, checkEnvVars } from '@/lib/env';
import getStripePromise from '@/utils/stripe-client';
import supabase from '@/utils/supabase';

// Check environment variables 
const envStatus = checkEnvVars();

// Stripe price IDs from environment variables
const STRIPE_PRICES = getStripePriceIds();

const publishableKey = getStripePublishableKey();
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

// Price IDs for subscription plans - USE THE STRIPE_PRICES OBJECT INSTEAD OF DIRECT ENV VARS
// const PRICE_ID_PREMIUM_MONTHLY = process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY;
// const PRICE_ID_PREMIUM_YEARLY = process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY;

interface PlanFeature {
  id: string;
  name: string;
  price: number | {
    monthly: number;
    yearly: number;
  };
  savings?: {
    yearly: string;
  };
  recipeLimit: string | number;
  saveLimit: string | number;
  features: string[];
  isPopular: boolean;
  buttonText: string;
}

// Plan configuration
const plans: PlanFeature[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    recipeLimit: 3,
    saveLimit: 5,
    features: [
      'Basic recipe variety',
      'Save up to 5 recipes',
      'Generate up to 3 recipes per month',
    ],
    isPopular: false,
    buttonText: 'Current Plan',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: {
      monthly: 3.99,
      yearly: 35.88, // 2.99 * 12
    },
    savings: {
      yearly: '25%',
    },
    recipeLimit: 'Unlimited',
    saveLimit: 'Unlimited',
    features: [
      'Unlimited recipe generations',
      'Save unlimited recipes',
      'Advanced recipe customization (coming soon)',
      'Priority support',
    ],
    isPopular: true,
    buttonText: 'Get Premium',
  },
  {
    id: 'family',
    name: 'Family',
    price: 9.99,
    recipeLimit: 'Unlimited',
    saveLimit: 'Unlimited',
    features: [
      'Everything in Premium',
      'Up to 5 user accounts',
      'Family meal planning',
      'Personalized recommendations',
      'Dietary preference options (coming soon)',
    ],
    isPopular: false,
    buttonText: 'Coming Soon',
  },
];

// Payment Form Component
interface PaymentFormProps {
  planId: string;
  billingPeriod: 'monthly' | 'yearly';
  onSuccess: () => void;
  onCancel: () => void;
}

const PaymentForm = ({ planId, billingPeriod, onSuccess, onCancel }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn&apos;t loaded yet
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setErrorMessage(error.message || 'An error occurred during payment processing.');
    } else {
      onSuccess();
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-green-700 mb-4">Complete Your Subscription</h2>
      <p className="text-gray-600 mb-6">
        You're subscribing to the {planId.charAt(0).toUpperCase() + planId.slice(1)} plan with {billingPeriod} billing.
      </p>
      
      <PaymentElement />
      
      <div className="mt-4">
        <AddressElement options={{
          mode: 'billing',
          fields: {
            phone: 'always',
          },
          validation: {
            phone: {
              required: 'always',
            },
          },
        }} />
      </div>
      
      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-md">
          {errorMessage}
        </div>
      )}
      
      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Subscribe Now'}
        </button>
      </div>
    </form>
  );
};

export default function SubscribePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const router = useRouter();
  const { user, subscription, loading } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calculate discount for yearly billing
  const yearlyDiscount = 0.25; // 25% discount
  const getDiscountedPrice = (price: number) => {
    if (billingPeriod === 'yearly') {
      return (price * 12 * (1 - yearlyDiscount)).toFixed(2);
    }
    return price.toFixed(2);
  };

  // Get price text based on billing period
  const getPriceText = (price: number) => {
    if (price === 0) return 'Free';
    
    if (billingPeriod === 'yearly') {
      const monthlyEquivalent = (price * 12 * (1 - yearlyDiscount) / 12).toFixed(2);
      return (
        <>
          ${monthlyEquivalent}<span className="text-sm text-gray-500 font-normal">/mo</span>
          <span className="text-xs text-[#265c40] font-normal mt-1 block">
            Billed as ${getDiscountedPrice(price)} yearly (save 25%)
          </span>
        </>
      );
    }
    
    return (
      <>
        ${price.toFixed(2)}<span className="text-sm text-gray-500 font-normal">/mo</span>
      </>
    );
  };

  // Handle subscription checkout
  const handleSubscribe = async (planId: string) => {
    if (!user) {
      // Redirect to auth page instead of login, preserving the plan and billing period
      router.push(`/auth?redirect=/subscribe&plan=${planId}&billing=${billingPeriod}`);
      return;
    }
    
    // Handle downgrade from premium to free
    if (planId === 'free' && subscription?.plan === 'premium') {
      // Check if the user is on a premium plan
      if (!subscription?.isActive) {
        setError('You are not currently on an active premium plan');
        return;
      }
      
      // Some premium users might not have a subscription ID in the database yet
      // Check for any subscription ID
      const subId = subscription?.subscription_id || subscription?.stripe_subscription_id;
      
      if (!window.confirm('Are you sure you want to downgrade to the free plan? Your premium benefits will end immediately after cancellation.')) {
        return;
      }
      
      try {
        setIsLoading(true);
        setSelectedPlan(planId);
        
        // First, try to use the Stripe Customer Portal if there's a stripe_customer_id
        if (subscription?.stripe_customer_id) {
          // Call the API to get a Stripe Customer Portal session
          const response = await fetch('/api/stripe/manage-subscription', {
            method: 'GET',
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.url) {
              window.location.href = data.url;
              return;
            }
          }
        }
        
        // Fallback to the downgrade API
        const response = await fetch('/api/user/downgrade-to-free', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
          }),
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to downgrade subscription');
        }
        
        const data = await response.json();
        
        // Check if we should redirect to Stripe
        if (data.redirectToStripe && data.url) {
          window.location.href = data.url;
          return;
        }
        
        // Show success message and refresh
        setError(null);
        setTimeout(() => {
          window.location.href = '/profile?tab=subscription';
        }, 1500);
        
      } catch (err: any) {
        console.error('Downgrade error:', err);
        setError(err.message || 'Failed to downgrade subscription');
        setIsLoading(false);
        setSelectedPlan(null);
      }
      return;
    }
    
    // Handle other plan selections (existing code)
    setSelectedPlan(planId);
    setIsLoading(true);
    
    try {
      // Get the appropriate price ID
      let priceId;
      
      if (planId === 'premium') {
        // Use correct price ID based on billing period
        priceId = billingPeriod === 'monthly' 
          ? STRIPE_PRICES.premium.monthly 
          : STRIPE_PRICES.premium.yearly;
      } else if (planId === 'free') {
        // Free plan doesn't need a checkout session
        window.location.href = '/profile?tab=subscription';
        return;
      } else {
        throw new Error('Invalid plan selected');
      }
      
      // Create checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          userId: user.id,
          userEmail: user.email,
        }),
      });
      
      // Check for HTML error response (not JSON)
      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', responseText);
        if (responseText.includes('<!DOCTYPE')) {
          throw new Error('Server error occurred. Please try again later.');
        } else {
          throw new Error('Invalid response from server');
        }
      }
      
      if (!response.ok || data.error) {
        throw new Error(data.error || 'An error occurred during checkout');
      }
      
      // Redirect to Stripe checkout
      if (data.url) {
        console.log('Redirecting to Stripe checkout URL:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'An error occurred during checkout');
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  // Get button text based on plan and subscription status
  const getButtonText = (planId: string) => {
    // If not logged in, show Sign In for all paid plans
    if (!user) {
      if (planId === 'free') {
        return 'Get Started';
      }
      if (planId === 'family') {
        return 'Coming Soon';
      }
      return 'Sign In to Subscribe';
    }
    
    // If currently loading this plan
    if (isLoading && selectedPlan === planId) {
      return 'Processing...';
    }
    
    // Coming soon for family plan
    if (planId === 'family') {
      return 'Coming Soon';
    }
    
    // If user is on this plan already
    if (subscription?.plan === planId) {
      return 'Current Plan';
    }
    
    // If user wants to downgrade from premium to free
    if (planId === 'free' && subscription?.plan === 'premium') {
      return 'Downgrade';
    }
    
    // Default button text
    return plans.find(p => p.id === planId)?.buttonText || 'Select Plan';
  };
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-[#265c40]">Choose Your Plan</h1>
        <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
          Start with our free plan or upgrade for more recipes and advanced features.
        </p>
        
        {/* Billing period toggle with improved microanimations */}
        <div className="mt-8 inline-flex items-center bg-gray-100 p-1 rounded-lg relative">
          {/* Sliding background with smoother animation */}
          <div 
            className={`absolute h-[calc(100%-8px)] top-1 bottom-1 rounded-md bg-white shadow-sm z-0 transition-all duration-300 ease-in-out transform ${
              billingPeriod === 'monthly' 
                ? 'translate-x-0 w-[100px]' 
                : 'translate-x-[108px] w-[140px]'
            }`}
            aria-hidden="true"
          />
          
          {/* Monthly button */}
          <button
            className={`relative z-10 px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out w-[100px] flex items-center justify-center ${
              billingPeriod === 'monthly' 
                ? 'text-[#265c40] transform scale-105' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setBillingPeriod('monthly')}
            aria-pressed={billingPeriod === 'monthly'}
          >
            <span>Monthly</span>
          </button>
          
          {/* Yearly button with savings badge */}
          <button
            className={`relative z-10 px-5 py-2 rounded-md text-sm font-medium transition-all duration-300 ease-in-out w-[140px] ${
              billingPeriod === 'yearly' 
                ? 'text-[#265c40] transform scale-105' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setBillingPeriod('yearly')}
            aria-pressed={billingPeriod === 'yearly'}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>Yearly</span>
              <div className={`text-xs font-medium px-1.5 py-0.5 bg-[#e2f1e8] rounded-full transition-all duration-300 ${
                billingPeriod === 'yearly' 
                  ? 'text-[#265c40] transform scale-110' 
                  : 'text-[#378c59]'
              }`}>
                Save 25%
              </div>
            </div>
          </button>
        </div>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mb-8 bg-red-50 text-red-700 p-4 rounded-lg text-center">
          <h3 className="font-bold mb-1">Payment Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        {plans.map((plan) => (
          <div 
            key={plan.id}
            className={`card relative transition-all duration-300 p-6 rounded-lg border ${
              selectedPlan === plan.id 
                ? 'border-[#378c59] border-2 transform scale-105 shadow-lg z-10' 
                : plan.isPopular ? 'border-t-4 border-t-[#378c59]' : 'border-t-4 border-t-[#9ac6ae]'
            } hover:shadow-xl hover:transform hover:scale-[1.03] bg-white cursor-pointer`}
            onClick={() => !isLoading && plan.id !== 'family' && handleSubscribe(plan.id)}
          >
            {plan.isPopular && (
              <div className="absolute top-0 right-0 bg-[#378c59] text-white px-3 py-1 text-sm font-bold uppercase rounded-bl-lg transform -translate-y-0 translate-x-0 transition-transform">
                Popular
              </div>
            )}
            
            <h2 className="text-2xl font-bold text-[#265c40] mb-2">{plan.name}</h2>
            
            <div className="mb-6">
              <p className="text-3xl font-bold text-[#153824] transition-all duration-300">
                {typeof plan.price === 'number' ? 
                  getPriceText(plan.price) :
                  getPriceText(billingPeriod === 'monthly' ? plan.price.monthly : plan.price.yearly / 12)
                }
              </p>
            </div>
            
            <div className="mb-6">
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-[#378c59] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  <strong>{plan.recipeLimit}</strong> recipe generations
                </span>
              </div>
              <div className="flex items-center mb-2">
                <svg className="h-5 w-5 text-[#378c59] mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span>
                  Save <strong>{plan.saveLimit}</strong> recipes
                </span>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-lg font-semibold text-[#265c40] mb-4">Features</h3>
              <ul className="space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="h-5 w-5 text-[#378c59] mr-2 mt-0.5 transition-transform duration-300 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoading && plan.id !== 'family' && !(!!user && subscription?.plan === plan.id)) {
                  handleSubscribe(plan.id);
                }
              }}
              disabled={isLoading || plan.id === 'family' || (!!user && subscription?.plan === plan.id)}
              className={`w-full py-2 px-4 rounded-md font-bold transition-all duration-300 ease-in-out transform ${
                selectedPlan === plan.id 
                  ? 'bg-[#378c59] hover:bg-[#265c40] text-white' 
                  : (!!user && subscription?.plan === plan.id)
                    ? 'bg-[#e2f1e8] text-[#153824]'
                    : 'border border-[#378c59] text-[#265c40] hover:bg-[#f0f8f3] hover:shadow-md'
              } ${plan.id === 'family' ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md hover:-translate-y-1'} ${isLoading && selectedPlan === plan.id ? 'opacity-75 cursor-wait' : ''}`}
            >
              {isLoading && selectedPlan === plan.id ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                getButtonText(plan.id)
              )}
            </button>
          </div>
        ))}
      </div>
      
      {/* FAQ Section */}
      <div className="max-w-3xl mx-auto mb-16">
        <h2 className="text-2xl font-bold text-[#265c40] mb-8 text-center">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-[#265c40] mb-2">Can I change plans later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. Changes will take effect at the start of your next billing cycle.
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-[#265c40] mb-2">What happens if I exceed my recipe limit?</h3>
            <p className="text-gray-600">
              On the free plan, you'll be prompted to upgrade once you've used your 3 recipe generations for the month. Premium and Family plans have unlimited recipe generations.
            </p>
          </div>
          
          <div className="p-6 border border-gray-200 rounded-lg">
            <h3 className="text-lg font-semibold text-[#265c40] mb-2">How do I cancel my subscription?</h3>
            <p className="text-gray-600">
              You can cancel your subscription anytime from your account settings. Your access will continue until the end of your current billing period.
            </p>
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#265c40] mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Choose a plan that works for you and start reducing food waste today. All plans come with a 14-day money-back guarantee.
        </p>
      </div>
    </div>
  );
} 