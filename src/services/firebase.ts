import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { LetterPhotoMetadata, PhotoFileType } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID (CRITICAL: Required for enterprise edition)
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Operation Types for error handling
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((p) => ({
          providerId: p.providerId,
          email: p.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection function on boot
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase connection verified.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Please check your Firebase configuration.');
    }
    return false;
  }
}

// Google Sign In with Popup
export async function signInWithGoogle(): Promise<FirebaseUser | null> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: unknown) {
    const firebaseErr = error as { code?: string; message?: string };
    if (
      firebaseErr?.code === 'auth/popup-closed-by-user' ||
      firebaseErr?.code === 'auth/cancelled-popup-request'
    ) {
      console.info('Google Sign-In popup closed by user or cancelled.');
      return null;
    }
    console.error('Google Sign-In Error:', error);
    throw error;
  }
}

// Sign Out
export async function logOut(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-Out Error:', error);
    throw error;
  }
}

export interface UploadPhotoResult {
  picId: string;
  photoUrl: string;
  metadata: LetterPhotoMetadata;
}

// Upload Physical Letter Photo to Backend
export async function uploadLetterPhoto(
  letterId: string,
  file: File | Blob,
  oldPicId?: string,
  oldExt?: string
): Promise<UploadPhotoResult> {
  const formData = new FormData();
  formData.append('photo', file);
  formData.append('letterId', letterId);
  if (oldPicId) formData.append('oldPicId', oldPicId);
  if (oldExt) formData.append('oldExt', oldExt);

  const response = await fetch('/api/upload-letter-photo', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Backend upload failed: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    picId: data.picId,
    photoUrl: data.photoUrl || `/api/photos/${data.picId}`,
    metadata: data.metadata,
  };
}

// Delete Physical Letter Photo by picId from bucket and backend
export async function deleteLetterPhoto(picId: string): Promise<void> {
  if (!picId) return;
  await fetch(`/api/photos/${picId}`, { method: 'DELETE' });
}

// Get app parameter from Firestore
export async function getAppParameter(key: string): Promise<string> {
  try {
    const docRef = doc(db, 'app_parameters', key);
    const docSnap = await getDocFromServer(docRef);
    return docSnap.exists() ? docSnap.data().value : 'N';
  } catch (error) {
    console.error('Error fetching app parameter:', error);
    return 'N';
  }
}

// Set app parameter in Firestore
export async function setAppParameter(key: string, value: string): Promise<void> {
  try {
    await setDoc(doc(db, 'app_parameters', key), { value });
  } catch (error) {
    console.error('Error setting app parameter:', error);
    throw error;
  }
}
