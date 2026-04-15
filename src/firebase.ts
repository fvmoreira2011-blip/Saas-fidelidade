import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export const requestFCMToken = async () => {
  if (typeof window === 'undefined' || !messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Use the messagingSenderId as a fallback if VAPID key is not explicitly provided
      // In a real app, you'd use a VAPID key from the Firebase Console
      const token = await getToken(messaging);
      return token;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
  return null;
};
