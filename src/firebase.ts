// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
export const db = getFirestore(firebaseApp);
export const storage = getStorage(firebaseApp);
export default firebaseApp;

