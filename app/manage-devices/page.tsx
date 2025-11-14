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
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchDevices() {
      try {
        const res = await fetch('/api/devices/list');
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch devices (${res.status})`);
        }
        const data = await res.json();
        setDevices(data.devices || []);
        setCurrentDeviceId(data.currentDeviceId || null);
      } catch (err: any) {
        console.error('Error fetching devices:', err);
        setError(err.message || 'Failed to fetch devices');
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
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to swap devices');
      }

      const data = await res.json();
      
      // Refresh the device list to show updated devices
      const refreshRes = await fetch('/api/devices/list');
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        setDevices(refreshData.devices || []);
        setCurrentDeviceId(refreshData.currentDeviceId || null);
      }

      // If this was a swap (during login), redirect to private page
      // Otherwise, just refresh the list and stay on manage-devices page
      if (data.message?.includes('swapped')) {
        router.push('/private');
      }

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
      const ua = userAgent.toLowerCase();
      
      // Check for specific browsers first (order matters)
      if (ua.includes('edg/') || ua.includes('edgios/')) return 'Microsoft Edge';
      if (ua.includes('opr/') || ua.includes('opera/')) return 'Opera';
      if (ua.includes('firefox/')) return 'Firefox';
      if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('chromium/')) return 'Safari';
      if (ua.includes('chrome/') && !ua.includes('edg/')) return 'Chrome';
      if (ua.includes('brave')) return 'Brave';
      if (ua.includes('samsungbrowser/')) return 'Samsung Internet';
      
      // Try to extract browser name from user agent
      const match = userAgent.match(/([A-Za-z]+)\//);
      if (match && match[1]) {
        return match[1].charAt(0).toUpperCase() + match[1].slice(1);
      }
      
      return 'Unknown Browser';
    } catch {
      return 'Unknown Browser';
    }
  }

  const deviceCount = devices.length;
  const maxDevices = parseInt(process.env.NEXT_PUBLIC_MAX_CONCURRENT_DEVICES || '3');
  const isAtLimit = deviceCount >= maxDevices;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-white sm:text-5xl mb-3">
          {isAtLimit ? 'Device Limit Reached' : 'Manage Your Devices'}
        </h1>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto">
          {isAtLimit ? (
            <>
              You are logged in on the maximum of <span className="font-semibold text-indigo-400">{maxDevices}</span> devices.
              <br />
              <span className="text-gray-400 mt-2 block">
                To log in on a new device, please log out from one of your active devices below.
              </span>
            </>
          ) : (
            <>
              You are currently logged in on <span className="font-semibold text-indigo-400">{deviceCount}</span> device{deviceCount !== 1 ? 's' : ''} 
              {' '}(limit: {maxDevices}).
            </>
          )}
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
          {devices.length === 0 ? (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700 p-8 text-center">
              <p className="text-gray-300 text-lg">No active devices found.</p>
            </div>
          ) : (
            devices.map((device) => {
              const isCurrentDevice = device.device_id === currentDeviceId;
              return (
                <div 
                  key={device.device_id} 
                  className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border transition-all duration-300 p-6 flex items-center justify-between ${
                    isCurrentDevice 
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50' 
                      : 'border-gray-700 hover:border-indigo-500'
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="flex-shrink-0">
                      {getDeviceIcon(device.user_agent)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-white text-lg">{parseUserAgent(device.user_agent)}</span>
                        {isCurrentDevice && (
                          <span className="px-2 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                            (This Device)
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-400">
                        Logged in: {new Date(device.logged_in_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {isCurrentDevice ? (
                    <div className="ml-4 px-6 py-3 rounded-xl text-sm font-semibold text-gray-400 bg-gray-700/50 border border-gray-600 cursor-not-allowed">
                      Current Device
                    </div>
                  ) : (
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
                  )}
                </div>
              );
            })
          )}
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