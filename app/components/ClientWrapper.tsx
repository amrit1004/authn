'use client';
import { useSessionCheck } from './UseSessionCheck';
import ForceLogoutModal from './ForceLogoutModal';

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
  const { isForceLoggedOut } = useSessionCheck();

  return (
    <>
      <ForceLogoutModal isOpen={isForceLoggedOut} />
      {children}
    </>
  );
}