import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);

// Anonymous auth removed for production: it grants request.auth with NO role/schoolId
// claims, which would let any "signed-in" client read/write every collection. Real users
// must authenticate via the app's IdP/email/phone flow; Firestore rules then enforce the
// role + schoolId custom claims defined in firestore.rules. Until that auth system lands,
// ScholarHub runs fully local-first from localStorage and cloud sync is intentionally off.

// Enable offline persistence for Firestore (works in supported browsers)
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence unavailable: multiple tabs open.');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence not supported in this browser.');
  }
});

export default firebaseApp;
