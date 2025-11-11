'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CompleteProfile() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!fullName || !phoneNumber) {
      setError('Please fill out both fields.');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, phoneNumber }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update profile');
      }

      // Success! Redirect to the private page.
      router.push('/private');

    } catch (err: any) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-3xl font-bold text-center">Complete Your Profile</h1>
      <p className="mt-2 text-center text-gray-400">
        We need a few more details to get you started.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 bg-gray-800 p-8 rounded-lg shadow-xl">
        {error && (
          <div className="p-3 bg-red-800 border border-red-600 text-red-100 rounded-md">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300">
            Full Name
          </label>
          <div className="mt-1">
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300">
            Phone Number
          </label>
          <div className="mt-1">
            <input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              autoComplete="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-700 text-white"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save and Continue'}
          </button>
        </div>
      </form>
    </div>
  );
}