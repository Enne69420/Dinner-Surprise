'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PricingRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/subscribe');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-(rgb(var(--green-600))) border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <h2 className="text-xl font-medium text-(rgb(var(--green-700)))">Redirecting to pricing page...</h2>
      </div>
    </div>
  );
} 