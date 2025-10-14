import React, { useState, useEffect } from 'react';

const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Update UI to notify the user they can install the PWA
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can't be used again
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  if (!showInstallPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-content">
        <div className="install-icon">📱</div>
        <div className="install-text">
          <h4>Install Soofia Clock Book</h4>
          <p>Install this app on your device for quick access</p>
        </div>
        <div className="install-buttons">
          <button onClick={handleDismiss} className="btn-cancel">
            Later
          </button>
          <button onClick={handleInstallClick} className="btn-install">
            Install
          </button>
        </div>
      </div>

      <style jsx>{`
        .install-prompt {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          padding: 20px;
          max-width: 350px;
          z-index: 1000;
          border: 1px solid #e2e8f0;
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .install-content {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .install-icon {
          font-size: 2rem;
        }

        .install-text h4 {
          margin: 0 0 5px 0;
          color: #1e293b;
          font-size: 1rem;
        }

        .install-text p {
          margin: 0;
          color: #64748b;
          font-size: 0.875rem;
        }

        .install-buttons {
          display: flex;
          gap: 10px;
          margin-top: 10px;
        }

        .btn-cancel, .btn-install {
          padding: 8px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-cancel {
          background: #f1f5f9;
          color: #64748b;
        }

        .btn-cancel:hover {
          background: #e2e8f0;
        }

        .btn-install {
          background: #3b82f6;
          color: white;
        }

        .btn-install:hover {
          background: #2563eb;
        }

        @media (max-width: 768px) {
          .install-prompt {
            left: 20px;
            right: 20px;
            max-width: none;
          }
        }
      `}</style>
    </div>
  );
};

export default InstallPrompt;