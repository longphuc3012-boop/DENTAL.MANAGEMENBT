import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  getDocFromServer,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { AppointmentItem } from '../data/dentalData';

const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying the firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Lỗi đăng nhập Google:', error);
    throw error;
  }
};

export const logoutGoogle = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Lỗi đăng xuất:', error);
    throw error;
  }
};

// Validate connection
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'schedules', 'connection_test'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is running in offline mode.');
    }
    return false;
  }
}

// Save day schedule to Firestore
export async function saveDailySchedule(
  dateKey: string,
  appointments: AppointmentItem[]
): Promise<void> {
  try {
    const scheduleRef = doc(db, 'schedules', dateKey);
    await setDoc(scheduleRef, {
      dateKey,
      appointments: appointments || [],
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(`Lỗi khi lưu lịch ngày ${dateKey} lên Firestore:`, error);
    throw error;
  }
}

// Load day schedule from Firestore
export async function loadDailySchedule(
  dateKey: string
): Promise<AppointmentItem[] | null> {
  try {
    const scheduleRef = doc(db, 'schedules', dateKey);
    const snap = await getDoc(scheduleRef);
    if (snap.exists()) {
      const data = snap.data();
      return (data.appointments as AppointmentItem[]) || [];
    }
    return null;
  } catch (error) {
    console.error(`Lỗi khi tải lịch ngày ${dateKey} từ Firestore:`, error);
    return null;
  }
}

// Realtime subscription for a date's appointments
export function subscribeDailySchedule(
  dateKey: string,
  onUpdate: (appointments: AppointmentItem[]) => void,
  onError?: (error: Error) => void
) {
  const scheduleRef = doc(db, 'schedules', dateKey);
  return onSnapshot(
    scheduleRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        onUpdate((data.appointments as AppointmentItem[]) || []);
      }
    },
    (err) => {
      console.error('Firestore onSnapshot error:', err);
      if (onError) onError(err);
    }
  );
}
