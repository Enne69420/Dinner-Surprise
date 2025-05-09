'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const router = useRouter();
  const { user, subscription, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push('/auth');
      return;
    }
    
    setIsLoading(false);
  }, [user, loading, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="w-16 h-16 border-4 border-[rgb(var(--green-500))] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold text-[rgb(var(--green-700))] mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Quick Stats */}
        <div className="card p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-[rgb(var(--green-700))] mb-4">Account</h2>
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Current Plan</p>
              <p className="font-semibold">
                {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}
              </p>
            </div>
          </div>
          <Link href="/profile" className="mt-auto text-[rgb(var(--green-600))] hover:text-[rgb(var(--green-700))] font-medium">
            Manage Profile →
          </Link>
        </div>
        
        <div className="card p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-[rgb(var(--green-700))] mb-4">Recipes</h2>
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Recipe Generations</p>
              <p className="font-semibold">
                {subscription.plan === 'premium' ? 'Unlimited' : `${subscription.recipesRemaining} remaining`}
              </p>
            </div>
          </div>
          <Link href="/recipes" className="mt-auto text-[rgb(var(--green-600))] hover:text-[rgb(var(--green-700))] font-medium">
            View Recipes →
          </Link>
        </div>
        
        <div className="card p-6 flex flex-col">
          <h2 className="text-xl font-semibold text-[rgb(var(--green-700))] mb-4">Grocery Lists</h2>
          <div className="flex items-center mb-2">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Shopping Lists</p>
              <p className="font-semibold">Create & Manage</p>
            </div>
          </div>
          <Link href="/grocery-list" className="mt-auto text-[rgb(var(--green-600))] hover:text-[rgb(var(--green-700))] font-medium">
            View Lists →
          </Link>
        </div>
      </div>
      
      {/* Subscription CTA for free users */}
      {subscription.plan === 'free' && (
        <div className="bg-[rgb(var(--green-50))] border border-[rgb(var(--green-100))] rounded-lg p-6 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-semibold text-[rgb(var(--green-800))] mb-2">
                Upgrade to Premium
              </h3>
              <p className="text-gray-600">
                Get unlimited recipe generations, save unlimited recipes, and access premium features.
              </p>
            </div>
            <div>
              <Link 
                href="/subscribe" 
                className="inline-block px-6 py-3 bg-[rgb(var(--green-600))] text-white rounded-md hover:bg-[rgb(var(--green-700))]"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Activity section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-[rgb(var(--green-700))] mb-6">Recent Activity</h2>
        
        <div className="bg-(rgb(255 255 255)) border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
            <p className="text-lg">Start creating recipes to see your activity here!</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-[rgb(var(--green-700))] mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/recipes/new" className="card p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--green-700))] mb-2">Create New Recipe</h3>
            <p className="text-gray-600">Generate a new recipe based on ingredients you have.</p>
          </Link>
          
          <Link href="/grocery-list/new" className="card p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--green-700))] mb-2">New Grocery List</h3>
            <p className="text-gray-600">Create a shopping list from your saved recipes.</p>
          </Link>
          
          <Link href="/profile" className="card p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--green-700))] mb-2">Account Settings</h3>
            <p className="text-gray-600">Manage your profile and subscription.</p>
          </Link>
          
          <Link href="/contact" className="card p-6 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-[rgb(var(--green-100))] rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-[rgb(var(--green-600))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--green-700))] mb-2">Contact Support</h3>
            <p className="text-gray-600">Need help? Contact our support team.</p>
          </Link>
        </div>
      </div>
    </div>
  );
} 