import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, PhoneAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// ✅ Deepya Collections — Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD4RPSipGHLuvgnIwxfoCskAqxpoAcJpEg",
  authDomain: "deepya-collections.firebaseapp.com",
  projectId: "deepya-collections",
  storageBucket: "deepya-collections.firebasestorage.app",
  messagingSenderId: "605046860629",
  appId: "1:605046860629:web:e5d45ce19a019404fd1ddc",
  measurementId: "G-99HKPYQF61"
};

// App Check debug token for phone verification (development)
if (typeof window !== 'undefined') {
  window.FIREBASE_APPCHECK_DEBUG_TOKEN =
    'AdpetEZ7TKeTdB1v2hDzbEP9yesQonmL6urnbJkYPvcLuUWbTb7sEI0SXAbbEqA0KDEGzJkE9HooEd5FlgDeSO7QkN7lo2nec9donJvphIBLl99jes8QhniBxKvf0RIN4XQrPRcbtskA-47CIgaPydGtLQ';
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Analytics (optional — works in production)
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch {
  // analytics not available in all environments
}

// Auth
export const auth = getAuth(app);

// Google provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Phone provider
export const phoneProvider = new PhoneAuthProvider(auth);

// Helper to create invisible reCAPTCHA verifier for phone OTP
export const createRecaptchaVerifier = (containerId = 'recaptcha-container') => {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {},
  });
};

export { analytics };
export default app;
