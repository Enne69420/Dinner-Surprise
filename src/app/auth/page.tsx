'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// Component to handle the auth form with search params
function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState('');
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/';
  const redirectCount = searchParams.get('redirectCount') || '0';
  const verified = searchParams.get('verified') === 'true';
  const { signIn, signUp, user } = useAuth();

  // Check if user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      try {
        let decodedRedirect = '/';
        
        // Try to decode the URL, but if it fails, use a default path
        try {
          decodedRedirect = redirectPath ? decodeURIComponent(redirectPath) : '/';
        } catch (e) {
          console.error('Error decoding redirect path', e);
          decodedRedirect = '/';
        }
        
        // If there was a redirect loop detected, go to home instead
        if (parseInt(redirectCount) > 1) {
          console.warn('Redirect loop detected, going to home page');
          decodedRedirect = '/';
        }
        
        console.log('User authenticated, redirecting to:', decodedRedirect);
        router.push(decodedRedirect);
      } catch (e) {
        console.error('Error during redirect:', e);
        router.push('/');
      }
    }
  }, [user, redirectPath, redirectCount, router]);

  // Check for email verification parameter
  useEffect(() => {
    if (verified) {
      setVerificationSuccess(true);
      // Try to get the email from local storage if available
      const storedEmail = localStorage.getItem('pendingVerificationEmail');
      if (storedEmail) {
        setVerifiedEmail(storedEmail);
        setEmail(storedEmail);
        setIsLogin(true); // Switch to login form
      }
    }
  }, [verified]);

  // Validate password
  const validatePassword = (password: string): boolean => {
    const hasEightChars = password.length >= 8;
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);
    
    if (!hasEightChars || !hasSpecialChar) {
      setPasswordError('Password must be at least 8 characters with at least 1 special character');
      return false;
    }
    
    setPasswordError(null);
    return true;
  };

  // Reset errors when switching between login and signup
  useEffect(() => {
    setError(null);
    setPasswordError(null);
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Password validation for both login and signup
    if (!isLogin && !validatePassword(password)) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        // Sign in logic
        const { error } = await signIn(email, password);
        if (error) throw error;
        
        // Redirect after successful login
        redirectAfterAuth();
      } else {
        // Sign up logic with improved error handling
        if (!name.trim()) {
          throw new Error('Name is required');
        }
        
        const { error, data, emailConfirmationRequired } = await signUp(email, password, name);
        
        if (error) {
          console.error('Sign up error details:', error);
          // Provide more user-friendly error messages
          if (error.message.includes('Database error saving new user')) {
            throw new Error('Unable to create account. Please try again later or contact support.');
          } else if (error.message.includes('already registered')) {
            throw new Error('This email is already registered. Please sign in instead.');
          } else {
            throw error;
          }
        }
        
        // Check if we actually got a user back
        if (!data?.user?.id) {
          throw new Error('Failed to create account. Please try again later.');
        }
        
        // Store the email for verification
        localStorage.setItem('pendingVerificationEmail', email);
        
        // Show verification message if email confirmation is required
        if (emailConfirmationRequired) {
          setVerificationSuccess(true);
          setVerifiedEmail(email);
          return; // Don't redirect yet
        } else {
          // User was automatically confirmed, redirect
          redirectAfterAuth();
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function to handle redirects after authentication
  const redirectAfterAuth = () => {
    try {
      let decodedRedirect = '/';
      try {
        decodedRedirect = redirectPath ? decodeURIComponent(redirectPath) : '/';
      } catch (e) {
        console.error('Error decoding redirect path', e);
      }
      
      if (parseInt(redirectCount) > 1) {
        decodedRedirect = '/';
      }
      
      console.log('Authentication successful, redirecting to:', decodedRedirect);
      router.push(decodedRedirect);
      router.refresh();
    } catch (e) {
      console.error('Error during redirect after auth:', e);
      router.push('/');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-12 mb-24">
      <div className="card shadow-lg border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-green-700 mb-8 text-center">
          {isLogin ? 'Welcome Back' : 'Create Your Account'}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}
        
        {verificationSuccess && (
          <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 text-sm">
            <p className="font-medium">Verification email sent!</p>
            <p>Please check your email ({verifiedEmail}) and click the verification link.</p>
            {isLogin && <p>You can now log in with your credentials.</p>}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="John Doe"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (!isLogin) validatePassword(e.target.value);
              }}
              className={`w-full px-4 py-3 rounded-md border ${
                passwordError ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent`}
              placeholder="••••••••"
              required
              minLength={8}
            />
            {passwordError && (
              <p className="text-red-600 text-xs mt-2">{passwordError}</p>
            )}
            {!isLogin && !passwordError && (
              <p className="text-gray-500 text-xs mt-2">
                Must be at least 8 characters with 1 special character
              </p>
            )}
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3 mt-4 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading
              ? 'Processing...'
              : isLogin
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 flex justify-between items-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-green-700 hover:underline font-medium"
          >
            {isLogin ? 'Need an account?' : 'Already have an account?'}
          </button>
          {isLogin && (
            <Link href="/forgot-password" className="text-sm text-green-700 hover:underline font-medium">
              Forgot password?
            </Link>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="relative flex justify-center">
            <span className="bg-white px-2 text-sm text-gray-500 absolute -top-3">
              Or continue with
            </span>
          </div>

          <div className="mt-6">
            <button
              type="button"
              className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              onClick={() => alert('Google auth would be implemented here')}
            >
              <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032 s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2 C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Sign in with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main Auth Page component with Suspense boundary
export default function AuthPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-96">
      <div className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
    </div>}>
      <AuthForm />
    </Suspense>
  );
} 