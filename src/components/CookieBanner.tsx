'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookie-consent');
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShowBanner(false);
  };

  const acceptEssential = () => {
    localStorage.setItem('cookie-consent', 'essential');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-[rgb(var(--green-100))] shadow-lg z-50 p-4">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 md:max-w-2xl">
            <p>
              We use cookies to improve your experience on our site. By clicking &quot;Accept All&quot;, you agree to our use of cookies for analytics, personalization, and advertising purposes.
              You can learn more in our <Link href="/cookies" className="text-[rgb(var(--green-600))] hover:underline">Cookie Policy</Link>.
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={acceptEssential}
              className="text-[rgb(var(--green-700))] border border-[rgb(var(--green-500))] hover:bg-[rgb(var(--green-50))] px-4 py-2 rounded-md text-sm font-medium"
            >
              Essential Only
            </button>
            <button 
              onClick={acceptAll}
              className="bg-[rgb(var(--green-600))] hover:bg-[rgb(var(--green-700))] text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 