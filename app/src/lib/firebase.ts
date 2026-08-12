import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase web config is public by design — it identifies the project, it does
// not grant access. Data is protected by Firestore security rules (users can
// only read/write their own document).
const firebaseConfig = {
  apiKey: 'AIzaSyCAhjtTjg_QQuSzC47ccXQzUOnY5osK-Zk',
  authDomain: 'find-my-pal-58e7c.firebaseapp.com',
  projectId: 'find-my-pal-58e7c',
  storageBucket: 'find-my-pal-58e7c.firebasestorage.app',
  messagingSenderId: '545750700420',
  appId: '1:545750700420:web:f6c1b19bd23c80dc388dd1',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
