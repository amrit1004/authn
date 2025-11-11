'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const POLLING_INTERVAL = 10000; 

export function useSessionCheck() {
  const [isForceLoggedOut, setIsForceLoggedOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/devices/check-status');
        if (!res.ok) {
          throw new Error('Session invalid');
        }
        
        const data = await res.json();
        
        if (!data.active) {
          setIsForceLoggedOut(true);
          clearInterval(intervalId);
          setTimeout(() => {
            router.push('/api/auth/logout');
          }, 3000);
        }
      } catch (error) {
        console.error('Session check failed:', error);
        setIsForceLoggedOut(true);
        clearInterval(intervalId);
        setTimeout(() => {
          router.push('/api/auth/logout');
        }, 3000);
      }
    };

    checkStatus();
    const intervalId = setInterval(checkStatus, POLLING_INTERVAL);
    return () => clearInterval(intervalId);
  }, [router]);

  return { isForceLoggedOut };
}