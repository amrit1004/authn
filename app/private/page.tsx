'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ClientWrapper from '../components/ClientWrapper';
import { UserIcon, EnvelopeIcon, PhoneIcon, IdentificationIcon, Cog6ToothIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';

interface Profile {
  full_name: string | null;
  phone_number: string | null;
}

export default function PrivatePage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAutoLogoutMessage, setShowAutoLogoutMessage] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchProfile() {
      if (isUserLoading || !user) return;
      
      setIsLoading(true);
      try {
        // Check for auto-logout message
        const flagsRes = await fetch('/api/session-flags');
        if (flagsRes.ok) {
          const flags = await flagsRes.json();
          if (flags.deviceAutoLoggedOut) {
            setShowAutoLogoutMessage(true);
            // Clear the flag after showing message (10 seconds)
            setTimeout(async () => {
              setShowAutoLogoutMessage(false);
              // Clear the flag from session
              try {
                await fetch('/api/clear-auto-logout-flag', { method: 'POST' });
              } catch (err) {
                // Ignore errors
              }
            }, 10000);
          }
        }

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
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-2">
            Your Private Dashboard
          </h1>
          <p className="text-gray-400 text-lg">
            Manage your account and view your profile information
          </p>
        </div>

        {showAutoLogoutMessage && (
          <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 text-yellow-100 rounded-xl flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="h-6 w-6 rounded-full bg-yellow-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">!</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold">Device Limit Reached</p>
              <p className="text-sm text-yellow-200">
                You were logged in successfully. Your oldest device was automatically logged out to make room for this new device.
              </p>
            </div>
          </div>
        )}

        {isUserLoading || isLoading ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
            <p className="text-gray-300 text-lg">Loading your information...</p>
          </div>
        ) : error ? (
          <div className="bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-2xl p-6 border border-red-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-red-600 flex items-center justify-center">
                  <span className="text-white font-bold">!</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-200 mb-1">Error Loading Profile</h3>
                <p className="text-red-300">{error}</p>
              </div>
            </div>
          </div>
        ) : profile ? (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{profile.full_name || user?.name || user?.email || 'User'}</h2>
                  <p className="text-indigo-100">Account Information</p>
                </div>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-indigo-600/20 flex items-center justify-center">
                      <EnvelopeIcon className="h-5 w-5 text-indigo-400" />
                    </div>
                    <dt className="text-sm font-medium text-gray-400 uppercase tracking-wide">Email Address</dt>
                  </div>
                  <dd className="text-lg font-semibold text-white mt-2 break-all">{user?.email}</dd>
                </div>

                <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                      <IdentificationIcon className="h-5 w-5 text-purple-400" />
                    </div>
                    <dt className="text-sm font-medium text-gray-400 uppercase tracking-wide">Full Name</dt>
                  </div>
                  <dd className="text-lg font-semibold text-white mt-2">
                    {profile.full_name || <span className="text-gray-500 italic">Not set</span>}
                  </dd>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-indigo-500 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                    <PhoneIcon className="h-5 w-5 text-green-400" />
                  </div>
                  <dt className="text-sm font-medium text-gray-400 uppercase tracking-wide">Phone Number</dt>
                </div>
                <dd className="text-lg font-semibold text-white mt-2">
                  {profile.phone_number || <span className="text-gray-500 italic">Not set</span>}
                </dd>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  href="/manage-devices"
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 hover:border-indigo-500 hover:from-indigo-600/30 hover:to-purple-600/30 transition-all group"
                >
                  <DevicePhoneMobileIcon className="h-6 w-6 text-indigo-400 group-hover:text-indigo-300" />
                  <span className="text-white font-semibold">Manage Devices</span>
                </Link>
                <Link
                  href="/complete-profile"
                  className="flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-500 hover:from-purple-600/30 hover:to-pink-600/30 transition-all group"
                >
                  <Cog6ToothIcon className="h-6 w-6 text-purple-400 group-hover:text-purple-300" />
                  <span className="text-white font-semibold">Edit Profile</span>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 text-center">
            <p className="text-gray-300 text-lg">Could not load profile information.</p>
          </div>
        )}
      </div>
    </ClientWrapper>
  );
}