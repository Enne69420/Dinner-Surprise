'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading, refreshSubscription } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const sid = searchParams.get('session_id');

    if (!sid) {
      setStatus('error');
      setErrorMessage('Session ID is missing');
      return;
    }
    
    // Single verification attempt
    const verifyPayment = async () => {
      if (status !== 'loading') return; // Skip if already verified
      
      try {
        const response = await fetch(`/api/stripe/verify-payment`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: sid
          }),
        });
        
        const data = await response.json();
        
        // If throttled, don't count as an attempt
        if (data.throttled) {
          return;
        }
        
        if (data.error) {
          console.error('Payment verification error:', data.error);
          setStatus('error');
          setErrorMessage(data.error);
          return;
        }
        
        // Payment succeeded
        setStatus('success');
        
        // After confirming success, refresh the subscription data if user is logged in
        if (user) {
          await refreshSubscription();
          
          // Auto-redirect to home page after 2 seconds
          setTimeout(() => {
            setIsRedirecting(true);
            router.push('/');  // Redirect to home page instead of profile
          }, 2000);
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setErrorMessage('Failed to verify payment. Please contact support.');
      }
    };
    
    // Initial verification
    if (sid && status === 'loading') {
      verifyPayment();
    }
    
    // Additional verification if needed, but limit attempts
    const checkInterval = setInterval(() => {
      setVerificationAttempts(prev => {
        // Only make additional call if we're still loading and haven't exceeded attempts
        if (status === 'loading' && prev < 2) {
          verifyPayment();
          return prev + 1;
        }
        
        // Clear interval if we're no longer loading or max attempts reached
        if (status !== 'loading' || prev >= 2) {
          clearInterval(checkInterval);
        }
        
        return prev;
      });
    }, 3000); // Check every 3 seconds, max 2 times
    
    return () => clearInterval(checkInterval);
  }, [searchParams, user, router, refreshSubscription, status]);

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="border border-gray-200 rounded-lg shadow-sm p-8 mb-8 bg-white">
        <h1 className="text-2xl font-bold text-green-700 mb-6 text-center">
          Payment Status
        </h1>
        
        {status === 'loading' && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-green-500 border-t-transparent mb-4"></div>
            <p className="text-gray-700">Verifying your payment...</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center bg-green-100 rounded-full p-2 mb-4">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your subscription. Your account has been upgraded.
            </p>
            {isRedirecting ? (
              <p className="text-sm text-gray-500">Redirecting you to home page...</p>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Go to Home
              </button>
            )}
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center bg-red-100 rounded-full p-2 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Verification Failed</h2>
            <p className="text-red-600 mb-4">
              {errorMessage || 'An error occurred while verifying your payment.'}
            </p>
            <button
              onClick={() => router.push('/subscribe')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
      
      <div className="text-center text-gray-500 text-sm">
        <p>If you have any questions or need assistance, please contact our support team.</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-12 px-4 text-center">Verifying payment...</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
} 