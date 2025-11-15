"use client";
import { useState, useEffect, useRef } from 'react';

const POLLING_INTERVAL = 10000;

export function useSessionCheck() {
  const [isForceLoggedOut, setIsForceLoggedOut] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoggedOut = useRef(false);

  useEffect(() => {
    if (hasLoggedOut.current) return;

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/devices/check-status', {
          credentials: 'include',
        });
        
        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            setIsForceLoggedOut(true);
            hasLoggedOut.current = true;
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return;
          }
          throw new Error('Session check failed');
        }
        
        const data = await res.json();
        
        if (!data.active) {
          setIsForceLoggedOut(true);
          hasLoggedOut.current = true;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
        }
      } catch (error) {
        console.error('Session check failed:', error);
      }
    };

    checkStatus();
    
    intervalRef.current = setInterval(checkStatus, POLLING_INTERVAL);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return { isForceLoggedOut };
}