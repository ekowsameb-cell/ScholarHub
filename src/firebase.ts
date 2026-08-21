import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC6IbyLlmwXchp507oaRe0sEUZ9nKr1v8E',
  authDomain: 'scholar-hub-198c5.firebaseapp.com',
  projectId: 'scholar-hub-198c5',
  storageBucket: 'scholar-hub-198c5.firebasestorage.app',
  messagingSenderId: '772649683244',
  appId: '1:772649683244:web:58451728c3e359c5338489',
  measurementId: 'G-YGM32WJRFK'
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
// Sign in anonymously so Firestore rules that require request.auth work for offline users.
signInAnonymously(auth).catch(err => console.error('Anonymous sign‑in error', err));
export const db = getFirestore(firebaseApp);
// Enable offline persistence for Firestore (works in supported browsers)
import { enableIndexedDbPersistence } from 'firebase/firestore';
enableIndexedDbPersistence(db).catch(err => {
  console.error('Firestore persistence enable error', err);
});
export const storage = getStorage(firebaseApp);
export default firebaseApp;
