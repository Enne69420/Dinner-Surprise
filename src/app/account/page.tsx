'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

// This is a simple redirect page that sends users to the profile page
export default function AccountPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  useEffect(() => {
    if (loading) return;
    
    if (!user) {
      router.push('/auth');
    } else {
      // Redirect to profile page with subscription tab active
      router.push('/profile?tab=subscription');
    }
  }, [user, loading, router]);
  
  return (
    <div className="flex justify-center items-center h-96">
      <div className="w-16 h-16 border-4 border-[rgb(var(--green-500))] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
} 