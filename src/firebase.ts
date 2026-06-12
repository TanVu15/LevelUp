import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

// Firebase is loaded lazily so the SDK stays out of the initial bundle — guests
// who never sign in never download it. `import type` above is erased at build, so
// nothing here pulls firebase into the main chunk. See
// .sdd/specs/feat-lazy-firebase/SPEC.md.

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

export interface FirebaseInstance {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}

let _instance: Promise<FirebaseInstance> | null = null;

/**
 * Lazily import + initialize Firebase. Returns null if not configured (guest-only
 * build). The promise is cached so concurrent callers share one initialization.
 */
export function loadFirebase(): Promise<FirebaseInstance> | null {
  if (!isConfigured) return null;
  if (!_instance) {
    _instance = (async () => {
      const [{ initializeApp, getApps }, { getAuth }, { getFirestore }] = await Promise.all([
        import('firebase/app'),
        import('firebase/auth'),
        import('firebase/firestore'),
      ]);
      const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

      // App Check (feat-app-check): chỉ kích hoạt khi có site key trong env.
      // Dev → bật debug token (SDK in token ra console, đăng ký ở Firebase console).
      const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
      if (siteKey) {
        try {
          if (import.meta.env.DEV) {
            (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
          }
          const { initializeAppCheck, ReCaptchaV3Provider } = await import('firebase/app-check');
          initializeAppCheck(app, {
            provider: new ReCaptchaV3Provider(siteKey),
            isTokenAutoRefreshEnabled: true,
          });
        } catch { /* App Check fail không chặn app — Firestore chỉ từ chối khi đã enforce */ }
      }

      return { app, auth: getAuth(app), db: getFirestore(app) };
    })();
  }
  return _instance;
}
