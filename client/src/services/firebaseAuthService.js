import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebase';

let activeConfirmationResult = null;
let activeRecaptchaVerifier = null;

export const setConfirmationResult = (result) => {
  activeConfirmationResult = result;
};

export const getConfirmationResult = () => {
  return activeConfirmationResult;
};

export const clearConfirmationResult = () => {
  activeConfirmationResult = null;
};

export const initRecaptcha = (containerId = 'recaptcha-container') => {
  if (activeRecaptchaVerifier) {
    try {
      activeRecaptchaVerifier.clear();
    } catch {
      // Ignore cleanup error if already cleared
    }
    activeRecaptchaVerifier = null;
  }

  const container = document.getElementById(containerId);
  if (!container) {
    throw new Error(`reCAPTCHA container element '#${containerId}' not found.`);
  }

  activeRecaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved - will proceed with submit
    },
    'expired-callback': () => {
      console.warn('[reCAPTCHA] Token expired. Resetting verifier.');
    },
  });

  return activeRecaptchaVerifier;
};

export const sendFirebaseOtp = async (phone10Digits, containerId = 'recaptcha-container') => {
  const digits = phone10Digits.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) {
    throw new Error('Please enter a valid 10-digit Indian phone number.');
  }

  const formattedPhone = `+91${digits}`;
  const appVerifier = initRecaptcha(containerId);

  try {
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
    setConfirmationResult(confirmationResult);
    return confirmationResult;
  } catch (error) {
    if (activeRecaptchaVerifier) {
      try {
        activeRecaptchaVerifier.clear();
      } catch {
        // Ignore cleanup error
      }
      activeRecaptchaVerifier = null;
    }
    throw error;
  }
};

export const verifyFirebaseOtp = async (otpCode) => {
  if (!activeConfirmationResult) {
    throw new Error('Verification session not found. Please request a new OTP.');
  }

  const userCredential = await activeConfirmationResult.confirm(otpCode);
  const idToken = await userCredential.user.getIdToken();

  return {
    user: userCredential.user,
    idToken,
  };
};

export const formatFirebaseError = (error) => {
  if (!error) return 'An unexpected error occurred. Please try again.';

  const code = error.code || '';
  const message = error.message || '';

  switch (code) {
    case 'auth/invalid-verification-code':
      return 'The OTP entered is incorrect. Please check and try again.';
    case 'auth/code-expired':
      return 'The OTP has expired. Please request a new verification code.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes before trying again.';
    case 'auth/invalid-phone-number':
      return 'The phone number provided is invalid. Please enter a valid 10-digit number.';
    case 'auth/quota-exceeded':
      return 'SMS quota exceeded for today. Please try again later.';
    case 'auth/captcha-check-failed':
      return 'reCAPTCHA verification failed. Please refresh the page and try again.';
    case 'auth/missing-phone-number':
      return 'Phone number is required.';
    case 'auth/invalid-app-credential':
      return 'Firebase configuration error. Check your Firebase credentials.';
    case 'auth/configuration-not-found':
      return 'Phone authentication is not enabled in your Firebase project. Please enable "Phone" sign-in method under Firebase Console > Authentication > Sign-in method.';
    default:
      return message || 'Authentication failed. Please try again.';
  }
};
