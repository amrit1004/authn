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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-center">Device Limit Reached</h1>
      <p className="mt-2 text-center text-lg text-gray-400">
        You are logged in on the maximum of **{process.env.NEXT_PUBLIC_MAX_CONCURRENT_DEVICES || 3}** devices. 
        To log in here, please log out from one of your other active devices.
      </p>
      
      {error && (
        <div className="my-4 p-3 bg-red-800 border border-red-600 text-red-100 rounded-md">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="text-center mt-8">Loading active devices...</p>
      ) : (
        <div className="mt-10 space-y-4">
          {devices.map((device) => (
            <div key={device.device_id} className="bg-gray-800 rounded-lg shadow-lg p-5 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getDeviceIcon(device.user_agent)}
                <div>
                  <div className="font-semibold text-white">{parseUserAgent(device.user_agent)}</div>
                  <div className="text-sm text-gray-400">
                    Logged in: {new Date(device.logged_in_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleForceLogout(device.device_id)}
                disabled={device.isLoading}
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                {device.isLoading ? 'Logging out...' : 'Log Out This Device'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/api/auth/logout" className="text-gray-400 hover:text-white">
          Cancel and Log Out
        </Link>
      </div>
    </div>
  );
}