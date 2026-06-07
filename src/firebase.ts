import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export const isConfigured = !!(
  import.meta.env.VITE_FIREBASE_API_KEY &&
  import.meta.env.VITE_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             ?? '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         ?? '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          ?? '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID              ?? '',
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;

if (isConfigured) {
  _app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _auth = getAuth(_app);
  _db   = getFirestore(_app);
}

export const auth = _auth;
export const db   = _db;
