'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/utils/supabase';

// Import STRIPE_PRICES from subscribe page constants
const STRIPE_PRICES = {
  premium: {
    monthly: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_MONTHLY || '',
    yearly: process.env.NEXT_PUBLIC_PRICE_ID_PREMIUM_YEARLY || '',
  },
  family: {
    monthly: 'price_family_monthly',  // Replace with your actual Stripe price ID
    yearly: 'price_family_yearly',    // Replace with your actual Stripe price ID
  }
};

function ProfileContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || 'personal');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const router = useRouter();
  const { user, subscription, signOut, refreshSubscription } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/auth');
      return;
    }

    // Initialize form with user data
    setName(user.user_metadata?.name || '');
    setEmail(user.email || '');

    // Fetch profile data including monthly_usage
    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('monthly_usage, saved_recipes_count, tier')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching profile data:', error);
        } else {
          setProfileData(data);
        }
      } catch (err) {
        console.error('Error in profile fetch:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfileData();
  }, [user, router]);

  // Update active tab when URL parameter changes
  useEffect(() => {
    if (tabParam && ['personal', 'subscription', 'security'].includes(tabParam)) {
      setActiveTab(tabParam);
      // Refresh profile data when switching to subscription tab
      if (tabParam === 'subscription' && user) {
        refreshProfileData();
      }
    }
  }, [tabParam, user]);

  const formatDate = (date: string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-SE');
  };

  // Function to refresh profile data
  const refreshProfileData = async () => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('monthly_usage, saved_recipes_count, tier')
        .eq('id', user.id)
        .single();
        
      if (error) {
        console.error('Error refreshing profile data:', error);
      } else {
        setProfileData(data);
      }
    } catch (err) {
      console.error('Error in profile refresh:', err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      // In a real app, you would call Supabase to update the user profile
      // Example: const { error } = await supabase.auth.updateUser({ data: { name } })
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('Profile updated successfully!');
        setIsEditingProfile(false);
        setIsLoading(false);
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to update profile');
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      // In a real app, you would call Supabase to update the password
      // Example: const { error } = await supabase.auth.updateUser({ password: newPassword })
      
      // Mock successful update
      setTimeout(() => {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setIsLoading(false);
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'Failed to change password');
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // In a real app, you would call Supabase to delete the user
        // Example: const { error } = await supabase.rpc('delete_user')
        
        await signOut();
        router.push('/');
      } catch (error: any) {
        setError(error.message || 'Failed to delete account');
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || isLoading) return;
    
    // Check if there's an active subscription
    if (!subscription || !subscription.isActive) {
      setError('No active subscription found');
      return;
    }
    
    // Get the subscription ID
    const subId = subscription.stripe_subscription_id || subscription.subscription_id;
    
    // Check if user wants to cancel
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Send cancellation request directly to our API
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: subId
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel subscription');
      }
      
      const result = await response.json();
      
      // If cancelled directly, refresh data and show success message
      await refreshSubscription();
      
      // Show success message regardless of whether we're redirecting
      setSuccess('Your subscription has been cancelled successfully and will end at the end of your billing period.');
      
      // Check if we need to redirect to Stripe portal to complete cancellation
      if (result.redirectToStripe && result.url) {
        // Give the user a moment to see the success message
        setTimeout(() => {
          window.location.href = result.url;
        }, 1500);
        return;
      }
    } catch (err: any) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'An error occurred while cancelling your subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeSubscription = async (newPlanId: string) => {
    try {
      setIsLoading(true);
      
      // If already subscribed, update the subscription
      if (subscription?.subscription_id && subscription.plan !== 'free') {
        const response = await fetch('/api/stripe/update-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subscriptionId: subscription.subscription_id,
            newPriceId: STRIPE_PRICES[newPlanId as keyof typeof STRIPE_PRICES]?.monthly,
            userId: user?.id,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        await refreshSubscription();
        setSuccess('Your subscription has been updated successfully.');
      } else {
        // If not subscribed, redirect to subscription page
        router.push('/subscribe');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update subscription');
    } finally {
      setIsLoading(false);
    }
  };

  // Add a function to sync subscription data between tables
  const syncSubscriptionData = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Call API endpoint to sync subscription data with Stripe
      const response = await fetch('/api/user/sync-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync subscription data');
      }
      
      // Refresh subscription in auth context
      await refreshSubscription();
      
      if (data.action !== 'none') {
        setSuccess('Subscription data has been synchronized with Stripe successfully.');
      } else {
        setSuccess('Subscription is already up to date.');
      }
      
      // Refresh the profile data
      await refreshProfileData();
    } catch (err: any) {
      console.error('Error syncing subscription data:', err);
      setError(err.message || 'Failed to sync subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  // Get first letter of user's name for avatar
  const getInitial = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Display loading or redirect if no user
  if (!user) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold text-[#265c40] mb-6">Your Profile</h1>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-[#f0f8f3] text-[#265c40] p-4 rounded-md mb-6">
          {success}
        </div>
      )}

      <div className="mb-8 flex border-b border-gray-200">
        <button
          className={`py-4 px-6 font-medium ${activeTab === 'personal' ? 'text-[#265c40] border-b-2 border-[#265c40]' : 'text-gray-500 hover:text-[#265c40]'}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Information
        </button>
        <button
          className={`py-4 px-6 font-medium ${activeTab === 'subscription' ? 'text-[#265c40] border-b-2 border-[#265c40]' : 'text-gray-500 hover:text-[#265c40]'}`}
          onClick={() => setActiveTab('subscription')}
        >
          Subscription
        </button>
        <button
          className={`py-4 px-6 font-medium ${activeTab === 'security' ? 'text-[#265c40] border-b-2 border-[#265c40]' : 'text-gray-500 hover:text-[#265c40]'}`}
          onClick={() => setActiveTab('security')}
        >
          Security
        </button>
      </div>

      {activeTab === 'personal' && (
        <div className="card p-6">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-[#265c40]">Personal Information</h2>
            {!isEditingProfile && (
              <button 
                onClick={() => setIsEditingProfile(true)}
                className="text-[#265c40] hover:text-[#153824] font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {isEditingProfile ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#265c40] focus:border-transparent"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#265c40] focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="btn-primary py-2 px-4"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="btn-secondary py-2 px-4"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 py-2">
                <span className="text-gray-600">Name:</span>
                <span className="col-span-2 font-medium">{user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Not set'}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 py-2">
                <span className="text-gray-600">Email:</span>
                <span className="col-span-2 font-medium">{user.email}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 py-2">
                <span className="text-gray-600">Account Created:</span>
                <span className="col-span-2 font-medium">{formatDate(user.created_at)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'subscription' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-[#265c40] mb-6">Subscription Details</h2>
          
          <div className="space-y-4">
            <div>
              <span className="font-medium">Current Plan:</span>
              <div className="mt-1">
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${subscription.plan === 'premium' ? 'bg-[#e2f1e8] text-[#265c40]' : 'bg-gray-100 text-gray-800'}`}>
                  {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
                </span>
                {subscription.status === 'active_until_period_end' && (
                  <span className="ml-2 inline-block px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                    Cancels At Period End
                  </span>
                )}
              </div>
            </div>
            
            {/* Subscription Status */}
            <div>
              <span className="font-medium">Subscription Status:</span>
              <div className="mt-1">
                <span className={`${
                  subscription.status === 'active' 
                    ? 'text-[#265c40]' 
                    : subscription.status === 'active_until_period_end' 
                      ? 'text-yellow-700' 
                      : 'text-gray-700'
                }`}>
                  {subscription.status === 'active' && 'Active'}
                  {subscription.status === 'active_until_period_end' && 'Active (Will Cancel)'}
                  {(subscription.status !== 'active' && subscription.status !== 'active_until_period_end') && 
                    (subscription.status || 'Not Subscribed')}
                </span>
              </div>
            </div>

            {/* Usage information based on plan */}
            <div>
              <span className="font-medium">Recipe Generations:</span>
              <div className="mt-1">
                <span className="text-gray-800">
                  {subscription.plan === 'premium' ? 
                    "Unlimited" : 
                    `${profileData?.monthly_usage ? (3 - profileData.monthly_usage) : 3} / 3 this month`
                  }
                </span>
              </div>
            </div>
            
            <div>
              <span className="font-medium">Recipe Saves:</span>
              <div className="mt-1">
                <span className="text-gray-800">
                  {subscription.plan === 'premium' ? 
                    "Unlimited" : 
                    `${profileData?.saved_recipes_count || 0} / 5 maximum`
                  }
                </span>
              </div>
            </div>
            
            {subscription.current_period_end && subscription.plan === 'premium' && (
              <div>
                <span className="font-medium">
                  {subscription.status === 'active_until_period_end' ? 'Premium access until:' : 'Next Billing Date:'}
                </span>
                <div className="mt-1">
                  <span className={`${
                    subscription.status === 'active_until_period_end' 
                      ? 'text-yellow-800' 
                      : 'text-gray-800'
                  } font-medium`}>
                    {formatDate(subscription.current_period_end)}
                  </span>
                </div>
              </div>
            )}
            
            {(subscription.plan === 'free') ? (
              <div className="mt-6">
                <Link 
                  href="/subscribe" 
                  className="px-6 py-2 bg-[#265c40] text-white font-medium rounded-md hover:bg-[#1a4730]"
                >
                  Upgrade to Premium
                </Link>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {subscription.status === 'active_until_period_end' ? (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-600 mt-0.5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-yellow-800 font-medium">Subscription Canceled</h4>
                        <p className="text-yellow-800 text-sm mt-1">
                          Your subscription will remain active until {formatDate(subscription.current_period_end)}. 
                          You'll continue to have full premium access until this date, after which your account will revert to the free plan.
                        </p>
                        <button
                          onClick={syncSubscriptionData}
                          className="mt-3 px-4 py-1.5 bg-yellow-100 border border-yellow-300 rounded-md text-yellow-800 text-sm font-medium hover:bg-yellow-200"
                        >
                          Resume Subscription
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleCancelSubscription}
                    className="text-red-600 hover:text-red-800 font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Processing...' : 'Cancel Subscription'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-8">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-[#265c40] mb-6">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#265c40] focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#265c40] focus:border-transparent"
                  minLength={8}
                  required
                />
                <p className="text-gray-500 text-xs mt-2">
                  Must be at least 8 characters with 1 special character
                </p>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#265c40] focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-[rgb(var(--green-600))] hover:bg-[rgb(var(--green-700))] text-white font-medium py-2 px-6 rounded-md"
                disabled={isLoading}
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
          
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-[#265c40] mb-6">Danger Zone</h2>
            <p className="text-gray-600 mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDeleteAccount}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <ProfileContent />
    </Suspense>
  );
} 