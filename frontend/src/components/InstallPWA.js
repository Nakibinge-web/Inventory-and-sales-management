import React, { useState, useEffect } from 'react';

export default function InstallPWA({ variant = 'button' }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already running in standalone PWA mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar on mobile and stash the event
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log('[PWA] StockPro successfully installed on this PC/device');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If prompt isn't captured yet, notify the user with helpful instruction
      alert('To install StockPro on your PC:\n• In Chrome/Edge, click the install icon in the address bar (top right)\n• Or open browser menu (...) → "Install StockPro / Install app"');
      return;
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the installation prompt');
        setIsInstalled(true);
      } else {
        console.log('[PWA] User dismissed the installation prompt');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error triggering install prompt:', err);
    }
  };

  if (isInstalled) {
    return null; // Don't show button if already running as installed app
  }

  if (variant === 'nav-item') {
    return (
      <button
        onClick={handleInstallClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15) 0%, rgba(99, 102, 241, 0.25) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.4)',
          borderRadius: 8,
          color: '#818cf8',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        title="Install StockPro as desktop app on your PC"
      >
        <span style={{ fontSize: 14 }}>💻</span>
        <span>Install App</span>
      </button>
    );
  }

  if (variant === 'sidebar-banner') {
    return (
      <div style={{
        marginTop: 'auto',
        padding: '12px',
        borderRadius: 10,
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        border: '1px solid #4338ca',
        color: '#e0e7ff',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>💻</span>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>Desktop App</div>
            <div style={{ fontSize: 10, color: '#a5b4fc' }}>Fast, offline PC access</div>
          </div>
        </div>
        <button
          onClick={handleInstallClick}
          style={{
            padding: '7px 12px',
            borderRadius: 6,
            background: '#4f46e5',
            color: '#fff',
            border: 'none',
            fontSize: 11,
            fontWeight: 700,
            cursor: 'pointer',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(79, 70, 229, 0.4)',
          }}
        >
          {deferredPrompt ? 'Install on PC ⬇' : 'Install Instructions ℹ️'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleInstallClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 18px',
        borderRadius: 8,
        border: '1px solid #4f46e5',
        background: 'rgba(79, 70, 229, 0.1)',
        color: '#818cf8',
        cursor: 'pointer',
        fontWeight: 600,
        fontSize: 13,
        transition: 'all 0.15s ease'
      }}
    >
      <span>💻</span>
      <span>Install Desktop App</span>
    </button>
  );
}
