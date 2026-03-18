import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getMessaging, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (getApps().length > 0) return getApps()[0] as FirebaseApp;
  const hasConfig = Object.values(firebaseConfig).every(Boolean);
  if (!hasConfig) return null;
  return initializeApp(firebaseConfig);
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app) return null;
  return getStorage(app);
}

export function getFirebaseMessaging(): Messaging | null {
  const app = getFirebaseApp();
  if (!app) return null;
  // messaging은 브라우저 환경에서만 사용
  return getMessaging(app);
}

