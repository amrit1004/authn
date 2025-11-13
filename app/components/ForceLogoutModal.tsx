'use client';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { Fragment, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForceLogoutModal({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (isOpen) {
      setCountdown(5);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/api/logout');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, router]);

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <Transition
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm transition-opacity" />
        </Transition>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg border border-gray-700">
                <div className="bg-transparent px-6 pb-6 pt-6 sm:p-8">
                  <div className="flex flex-col items-center text-center">
                    <div className="mx-auto flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-red-700 shadow-lg">
                      <ExclamationTriangleIcon className="h-8 w-8 text-white" aria-hidden="true" />
                    </div>
                    <div className="mt-6">
                      <Dialog.Title as="h3" className="text-2xl font-bold leading-7 text-white mb-2">
                        Session Terminated
                      </Dialog.Title>
                      <div className="mt-4 space-y-3">
                        <p className="text-base text-gray-300 leading-relaxed">
                          You have been logged out because this account was logged in on another device.
                        </p>
                        <p className="text-sm text-gray-400">
                          For security reasons, we limit concurrent sessions to {process.env.NEXT_PUBLIC_MAX_CONCURRENT_DEVICES || 3} devices.
                        </p>
                        <div className="mt-6 pt-4 border-t border-gray-700">
                          <p className="text-sm text-gray-400 flex items-center justify-center gap-2">
                            Redirecting to login page in
                            <span className="font-semibold text-indigo-400 text-lg">{countdown}</span>
                            {countdown === 1 ? 'second' : 'seconds'}
                            <ArrowRightIcon className="h-4 w-4 text-gray-500" />
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}