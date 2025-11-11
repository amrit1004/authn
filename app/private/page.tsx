'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import ClientWrapper from '../components/ClientWrapper';

interface Profile {
  full_name: string;
  phone_number: string;
}

export default function PrivatePage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (isUserLoading || !user) return;
      
      setIsLoading(true);
      try {
        const res = await fetch('/api/user/profile');
        if (!res.ok) {
          throw new Error('Failed to fetch profile');
        }
        const data = await res.json();
        setProfile(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user, isUserLoading]);

  return (
    <ClientWrapper>
      <div className="bg-gray-800 shadow-lg rounded-lg p-8 max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-white">Your Private Dashboard</h1>
        
        {isUserLoading || isLoading ? (
          <p className="mt-4 text-gray-300">Loading your information...</p>
        ) : error ? (
           <div className="mt-4 p-3 bg-red-800 border border-red-600 text-red-100 rounded-md">
            Error: {error}
          </div>
        ) : profile ? (
          <div className="mt-6 space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-400">Email</dt>
              <dd className="mt-1 text-lg text-white">{user?.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Full Name</dt>
              <dd className="mt-1 text-lg text-white">{profile.full_name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-400">Phone Number</dt>
              <dd className="mt-1 text-lg text-white">{profile.phone_number}</dd>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-gray-300">Could not load profile.</p>
        )}
      </div>
    </ClientWrapper>
  );
}