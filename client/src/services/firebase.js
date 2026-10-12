import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

// Public Firebase web config. Values come from the root .env (VITE_FIREBASE_*).
// The server SDK credentials are server-side only and never loaded by the browser.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  config.apiKey && config.projectId && config.appId
);

function getFirebaseApp() {
  if (!isFirebaseConfigured) {
    throw new Error(
      'Google sign-in is not configured yet. Add the Firebase web config (VITE_FIREBASE_*) to your .env file.'
    );
  }
  return getApps().length ? getApps()[0] : initializeApp(config);
}

export async function getGoogleIdToken() {
  const auth = getAuth(getFirebaseApp());
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const idToken = await result.user.getIdToken();
  return { idToken, firebaseUser: result.user };
}

export async function signOutFirebase() {
  try {
    if (getApps().length) {
      await signOut(getAuth(getFirebaseApp()));
    }
  } catch (_err) {
    // Ignore sign-out errors (e.g. no active session).
  }
}