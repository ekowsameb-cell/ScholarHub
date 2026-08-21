import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, limit, query } from 'firebase/firestore';

/**
 * OfflineBanner displays a notification bar when the app cannot reach Firebase services.
 * It attempts a lightweight read from a dedicated "connectivity" collection.
 * If the read fails (e.g., network error), the banner is shown.
 */
const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Attempt a simple Firestore read as a connectivity check.
    const checkConnection = async () => {
      try {
        // "connectivity" collection can be empty; we just attempt to get any doc.
        const q = query(collection(db, 'connectivity'), limit(1));
        await getDocs(q);
        setIsOffline(false);
      } catch (error) {
        console.error('Firebase connectivity check failed:', error);
        setIsOffline(true);
      }
    };
    // Run on mount and then every 30 seconds.
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
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
