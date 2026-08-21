import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';


/**
 * OfflineBanner displays a notification bar when the app cannot reach Firebase services.
 * It attempts a lightweight read from a dedicated "connectivity" collection.
 * If the read fails (e.g., network error), the banner is shown.
 */
const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Wait for Firebase auth (including anonymous sign‑in) to be ready before checking connectivity.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Once we have a signed‑in user (even anonymous), start the connectivity check.
        const checkConnection = async () => {
          try {
            const q = query(collection(db, 'connectivity'), limit(1));
            await getDocs(q);
            setIsOffline(false);
          } catch (error) {
            console.error('Firebase connectivity check failed:', error);
            setIsOffline(true);
          }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 30000);
        return () => clearInterval(interval);
      }
    });
    // Clean up auth listener on unmount
    return () => unsubscribe();
  }, []);

  if (!isOffline) return null;

  return (
    <div className="offline-banner" style={{
      background: 'linear-gradient(90deg, #f87171, #ef4444)',
      color: '#fff',
      padding: '0.5rem 1rem',
      textAlign: 'center',
      fontSize: '0.9rem',
      fontWeight: 600,
      position: 'relative',
      zIndex: 1000,
    }}>
      You appear to be offline. Data will be stored locally and synced when connection is restored.
    </div>
  );
};

export default OfflineBanner;
