'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function Header() {
  const { user, isLoading } = useUser();

  return (
    <nav className="bg-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold text-white">
              N-Device App
            </Link>
            <div className="flex space-x-4">
              <Link href="/public" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                Public Page
              </Link>
              <Link href="/private" className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white">
                Private Page
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {isLoading && <div className="text-sm text-gray-400">Loading...</div>}
            {!isLoading && !user && (
              <Link
                href="/api/auth/login"
                className="px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Login
              </Link>
            )}
            {!isLoading && user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300 hidden sm:block">
                  {/* This is the correct way for this plan */ }
                  {user.name || user.email}
                </span>
                <Link
                  href="/api/auth/logout"
                  className="px-4 py-2 rounded-md text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600"
                >
                  Logout
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}