'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const Navbar = () => {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <span className="text-2xl font-bold text-[#265c40]">Dinner Surprise</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/' 
                    ? 'bg-[#265c40] text-white' 
                    : 'text-[#265c40] hover:bg-[#f0f8f3]'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/recipes" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/recipes' 
                    ? 'bg-[#265c40] text-white' 
                    : 'text-[#265c40] hover:bg-[#f0f8f3]'
                }`}
              >
                Recipes
              </Link>
              <Link 
                href="/grocery-list" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/grocery-list' 
                    ? 'bg-[#265c40] text-white' 
                    : 'text-[#265c40] hover:bg-[#f0f8f3]'
                }`}
              >
                Grocery List & Recipe Generator
              </Link>
              <Link 
                href="/subscribe" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/subscribe' 
                    ? 'bg-[#265c40] text-white' 
                    : 'text-[#265c40] hover:bg-[#f0f8f3]'
                }`}
              >
                Pricing
              </Link>
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-[#265c40] hover:text-white hover:bg-[#265c40] focus:outline-none"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Icon when menu is closed */}
              <svg
                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Icon when menu is open */}
              <svg
                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          <div className="hidden md:block">
            {user ? (
              <div className="relative" ref={profileDropdownRef}>
                <button 
                  onClick={toggleProfileMenu}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <span className="text-[#265c40] hidden sm:inline-block">
                    Hello, {user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                  <div className="w-9 h-9 rounded-full bg-[#265c40] text-white flex items-center justify-center font-medium">
                    {getInitial()}
                  </div>
                </button>
                
                {/* Profile dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 origin-top-right transform transition-all duration-200 ease-out animate-dropdown">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f8f3] hover:text-[#265c40] transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Your Profile
                      </Link>
                      <Link
                        href="/profile?tab=subscription"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f8f3] hover:text-[#265c40] transition-colors duration-150"
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        Subscription
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-[#f0f8f3] hover:text-[#265c40] transition-colors duration-150"
                        role="menuitem"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/auth" 
                className="px-4 py-2 border border-[#265c40] text-[#265c40] rounded-md hover:bg-[#265c40] hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state */}
      <div
        className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}
        id="mobile-menu"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link
            href="/"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/' 
                ? 'bg-[#265c40] text-white' 
                : 'text-[#265c40] hover:bg-[#f0f8f3]'
            }`}
          >
            Home
          </Link>
          <Link
            href="/recipes"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/recipes' 
                ? 'bg-[#265c40] text-white' 
                : 'text-[#265c40] hover:bg-[#f0f8f3]'
            }`}
          >
            Recipes
          </Link>
          <Link
            href="/grocery-list"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/grocery-list' 
                ? 'bg-[#265c40] text-white' 
                : 'text-[#265c40] hover:bg-[#f0f8f3]'
            }`}
          >
            Grocery List & Recipe Generator
          </Link>
          <Link
            href="/subscribe"
            className={`block px-3 py-2 rounded-md text-base font-medium ${
              pathname === '/subscribe' 
                ? 'bg-[#265c40] text-white' 
                : 'text-[#265c40] hover:bg-[#f0f8f3]'
            }`}
          >
            Pricing
          </Link>
          {user ? (
            <>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-[#265c40] hover:bg-[#f0f8f3]"
              >
                Your Profile
              </Link>
              <button
                onClick={handleSignOut}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-[#265c40] hover:bg-[#f0f8f3]"
              >
                Sign Out
              </button>
            </>
          ) : (
            <Link
              href="/auth"
              className="block px-3 py-2 rounded-md text-base font-medium text-[#265c40] hover:bg-[#f0f8f3]"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 