import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

export default function Layout() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {isOffline && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: 'var(--accent-red)',
          color: 'var(--text-inverse)',
          textAlign: 'center',
          padding: '8px',
          paddingTop: 'calc(8px + env(safe-area-inset-top))',
          fontSize: 'var(--font-xs)',
          fontWeight: 600,
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-sm)',
          boxShadow: 'var(--shadow-md)',
          transition: 'all var(--transition-base)'
        }}>
          ⚠️ Anda sedang offline. Sistem auto-sinkron berjalan.
        </div>
      )}
      <div style={{ paddingTop: isOffline ? 'calc(36px + env(safe-area-inset-top))' : '0', transition: 'padding var(--transition-base)' }}>
        <Outlet />
      </div>
      <BottomNav />
    </>
  );
}
