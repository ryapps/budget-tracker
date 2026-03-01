import { useEffect, useState } from 'react';

// Define the BeforeInstallPromptEvent interface since it's not standard yet
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: Array<string>;
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed natively
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      // Clear the deferredPrompt and hide the UI
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt || isInstalled) {
    return null;
  }

  return (
    <div style={{
      background: 'var(--gradient-card)',
      border: '1px solid var(--accent-green)',
      borderRadius: 'var(--radius-lg)',
      padding: 'var(--spacing-lg)',
      marginBottom: 'var(--spacing-2xl)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 'var(--spacing-md)',
      boxShadow: 'var(--shadow-md)',
      animation: 'fadeIn var(--transition-base)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'var(--accent-green-dim)',
          color: 'var(--accent-green)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px'
        }}>
          📲
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--font-base)', color: 'var(--text-primary)' }}>
            Install Aplikasi
          </div>
          <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
            Akses lebih cepat tanpa browser.
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleInstallClick}
        style={{
          background: 'var(--accent-green)',
          color: 'var(--text-inverse)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-pill)',
          fontWeight: 600,
          fontSize: 'var(--font-sm)',
          boxShadow: 'var(--shadow-glow-green)',
          flexShrink: 0
        }}
      >
        Install
      </button>
    </div>
  );
}
