'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DevicePhoneMobileIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

interface ActiveDevice {
  device_id: string;
  user_agent: string;
  logged_in_at: string;
}

type DeviceWithLoading = ActiveDevice & { isLoading?: boolean };

export default function ManageDevices() {
  const [devices, setDevices] = useState<DeviceWithLoading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch('/api/devices/list');
        if (!res.ok) throw new Error('Failed to fetch devices');
        const data = await res.json();
        setDevices(data.devices);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDevices();
  }, []);

  const handleForceLogout = async (deviceIdToLogout: string) => {
    setDevices(currentDevices =>
      currentDevices.map(d =>
        d.device_id === deviceIdToLogout ? { ...d, isLoading: true } : d
      )
    );
    setError(null);

    try {
      const res = await fetch('/api/devices/swap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ deviceToLogoutId: deviceIdToLogout }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to swap devices');
      }

      router.push('/private');

    } catch (err: any) {
      setError(err.message);
      setDevices(currentDevices =>
        currentDevices.map(d =>
          d.device_id === deviceIdToLogout ? { ...d, isLoading: false } : d
        )
      );
    }
  };
  
  const getDeviceIcon = (userAgent: string) => {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) {
      return <DevicePhoneMobileIcon className="h-10 w-10 text-gray-400" />;
    }
    return <ComputerDesktopIcon className="h-10 w-10 text-gray-400" />;
  };

  const parseUserAgent = (userAgent: string) => {
    try {
      if (userAgent.includes('Firefox/')) return `Firefox`;
      if (userAgent.includes('Chrome/')) return `Chrome`;
      if (userAgent.includes('Safari/')) return `Safari`;
      return userAgent.split('(')[0].trim();
    } catch {
      return 'Unknown Device';
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-3">Device Limit Reached</h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          You are logged in on the maximum of <span className="font-semibold text-indigo-400">{process.env.NEXT_PUBLIC_MAX_CONCURRENT_DEVICES || 3}</span> devices.
        </p>
        <p className="mt-2 text-gray-400">
          To log in here, please log out from one of your other active devices below.
        </p>
      </div>
      
      {error && (
        <div className="my-6 p-4 bg-red-900/30 border border-red-700 text-red-100 rounded-xl flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="h-6 w-6 rounded-full bg-red-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
          </div>
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-12 border border-gray-700 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-300 text-lg">Loading active devices...</p>
        </div>
      ) : (
        <div className="mt-10 space-y-4">
          {devices.map((device) => (
            <div 
              key={device.device_id} 
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700 hover:border-indigo-500 transition-all duration-300 p-6 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex-shrink-0">
                  {getDeviceIcon(device.user_agent)}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg mb-1">{parseUserAgent(device.user_agent)}</div>
                  <div className="text-sm text-gray-400">
                    Logged in: {new Date(device.logged_in_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleForceLogout(device.device_id)}
                disabled={device.isLoading}
                className="ml-4 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 shadow-lg"
              >
                {device.isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                    Logging out...
                  </span>
                ) : (
                  'Log Out This Device'
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 text-center">
        <Link 
          href="/api/logout" 
          className="inline-block px-6 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-gray-800 border border-gray-700 transition-all"
        >
          Cancel and Log Out
        </Link>
      </div>
    </div>
  );
}