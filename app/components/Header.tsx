'use client';
import { useUser } from '@auth0/nextjs-auth0/client';
import Link from 'next/link';

export default function Header() {
  const { user, isLoading } = useUser();

  return (
    <nav className="bg-gradient-to-r from-gray-900 to-gray-800 shadow-xl border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent hover:from-indigo-300 hover:to-purple-300 transition-all">
              N-Device App
            </Link>
            <div className="hidden md:flex space-x-1">
              <Link 
                href="/public" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all"
              >
                Public Page
              </Link>
              <Link 
                href="/private" 
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-700/50 hover:text-white transition-all"
              >
                Private Page
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-indigo-500"></div>
                <span>Loading...</span>
              </div>
            )}
            {!isLoading && !user && (
              <Link
                href="/api/auth/login"
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-indigo-500/50 transform hover:scale-105 active:scale-95"
              >
                Login
              </Link>
            )}
            {!isLoading && user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-300 hidden sm:block px-3 py-1.5 rounded-lg bg-gray-700/50">
                  {user.name || user.email}
                </span>
                <Link
                  href="/api/logout"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white transition-all"
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