'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/utils/supabase';

const SubscriptionInitializer = () => {
  const { user, refreshSubscription } = useAuth();
  const [initialized, setInitialized] = useState(false);
  
  useEffect(() => {
    const syncSubscription = async () => {
      if (!user || initialized) return;
      
      try {
        // First refresh the auth session to ensure we have a fresh token
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (!sessionData.session) {
          console.warn('No valid session found when trying to sync subscription');
          setInitialized(true);
          return;
        }
        
        // Call the sync API with credentials included to send cookies
        const response = await fetch('/api/user/sync-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          },
          credentials: 'include', // Add this to ensure cookies are sent
          body: JSON.stringify({ userId: user.id }),
        });
        
        if (response.ok) {
          // Refresh the subscription data
          await refreshSubscription();
          console.log('Subscription synced successfully');
        } else {
          // Parse the error response as JSON first
          let errorText;
          try {
            const errorData = await response.json();
            errorText = JSON.stringify(errorData);
          } catch (e) {
            // Fallback to text if it's not JSON
            errorText = await response.text();
          }
          console.error('Error syncing subscription:', errorText);
          
          // If this is an auth error, we might want to refresh the auth state
          if (response.status === 401) {
            console.log('Authentication error detected. User may need to log in again.');
          }
        }
      } catch (error) {
        console.error('Error calling sync API:', error);
      } finally {
        setInitialized(true);
      }
    };
    
    syncSubscription();
  }, [user, initialized, refreshSubscription]);
  
  // This component doesn't render anything
  return null;
};

export default SubscriptionInitializer; 