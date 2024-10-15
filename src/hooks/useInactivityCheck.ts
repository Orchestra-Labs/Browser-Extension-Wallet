import { useEffect, useRef } from 'react';
import { useLogout } from './useLogout';
import { INACTIVITY_TIMEOUT } from '@/constants';

/**
 * Custom hook to handle user inactivity and automatic logout.
 */
export const useInactivityCheck = () => {
  const lastActivityTimeRef = useRef(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      lastActivityTimeRef.current = Date.now();
    };

    const checkInactivity = () => {
      const timeSinceLastActivity = Date.now() - lastActivityTimeRef.current;
      if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
        useLogout();
      }
    };

    // Add event listeners to track user activity
    window.addEventListener('keypress', handleActivity);

    // Set an interval to check for inactivity
    const inactivityInterval = setInterval(checkInactivity, 60 * 1000);

    return () => {
      clearInterval(inactivityInterval);
      window.removeEventListener('keypress', handleActivity);
    };
  }, []);
};
