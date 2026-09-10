import { initializeApp, getApps, getApp, cert, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import env from './env.js';

let firebaseAdminApp = null;

export const initFirebaseAdmin = () => {
  if (getApps().length > 0) {
    return getApp();
  }

  try {
    if (env.firebaseProjectId && env.firebaseClientEmail && env.firebasePrivateKey) {
      const privateKey = env.firebasePrivateKey.replace(/\\n/g, '\n');
      firebaseAdminApp = initializeApp({
        credential: cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey,
        }),
      });
      console.log('[Firebase Admin] Initialized with service account credentials.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      firebaseAdminApp = initializeApp({
        credential: applicationDefault(),
      });
      console.log('[Firebase Admin] Initialized with Application Default Credentials.');
    } else {
      console.warn('[Firebase Admin Warning] No service account credentials found in environment. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set in .env.');
      firebaseAdminApp = initializeApp({
        projectId: env.firebaseProjectId || 'rozgaarsetu-dev',
      });
    }
  } catch (error) {
    console.error('[Firebase Admin Initialization Error]:', error.message);
  }

  return firebaseAdminApp;
};

initFirebaseAdmin();

export const adminAuth = () => getAuth(getApps().length > 0 ? getApp() : undefined);

let customVerifier = null;

export const setCustomIdTokenVerifier = (verifier) => {
  customVerifier = verifier;
};

export const verifyFirebaseIdToken = async (idToken) => {
  if (customVerifier) {
    return customVerifier(idToken);
  }
  const auth = adminAuth();
  return auth.verifyIdToken(idToken);
};

export default {
  initFirebaseAdmin,
  adminAuth,
  verifyFirebaseIdToken,
  setCustomIdTokenVerifier,
};
