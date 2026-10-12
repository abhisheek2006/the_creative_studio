const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const env = require('./env');

const APP_NAME = 'tcs';

let firebaseAuth = null;

function isFirebaseConfigured() {
  return Boolean(env.firebaseEnabled);
}

function getFirebaseAuth() {
  if (!isFirebaseConfigured()) return null;
  if (firebaseAuth) return firebaseAuth;

  const existing = (admin.apps || []).find((app) => app && app.name === APP_NAME);
  const app =
    existing ||
    admin.initializeApp(
      {
        credential: admin.cert({
          projectId: env.firebase.projectId,
          clientEmail: env.firebase.clientEmail,
          privateKey: env.firebase.privateKey,
        }),
      },
      APP_NAME
    );

  firebaseAuth = getAuth(app);
  return firebaseAuth;
}

// Verifies a Firebase ID token (from the browser SDK) and returns its claims.
async function verifyIdToken(idToken) {
  const auth = getFirebaseAuth();
  if (!auth) {
    const err = new Error('Firebase is not configured on the server.');
    err.code = 'firebase/not-configured';
    throw err;
  }
  return auth.verifyIdToken(idToken, true);
}

module.exports = { isFirebaseConfigured, getFirebaseAuth, verifyIdToken };
