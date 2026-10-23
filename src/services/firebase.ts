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

import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { LetterPhotoMetadata, PhotoFileType } from '../types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID (CRITICAL: Required for enterprise edition)
export const db = getFirestore(app, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID);

// Initialize Storage (direct browser uploads, secured by storage.rules)
// Explicitly target the configured bucket so uploads don't fall back to the
// project's default bucket (which may differ from VITE_FIREBASE_STORAGE_BUCKET).
const storage = getStorage(app, `gs://${import.meta.env.VITE_FIREBASE_STORAGE_BUCKET}`);

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

const PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];

function getPhotoType(ext: string): PhotoFileType {
  const e = ext.toUpperCase();
  return (['JPG', 'JPEG', 'PNG', 'GIF', 'BMP'].includes(e) ? e : 'JPG') as PhotoFileType;
}

// Upload Physical Letter Photo directly to Firebase Storage (no backend)
export async function uploadLetterPhoto(
  letterId: string,
  file: File | Blob,
  oldPicId?: string,
  oldExt?: string
): Promise<UploadPhotoResult> {
  if (oldPicId) await deleteLetterPhoto(oldPicId, oldExt).catch(() => {});

  const picId = crypto.randomUUID();
  const originalName = (file as File).name || 'photo.jpg';
  const rawExt = originalName.includes('.') ? originalName.split('.').pop()!.toLowerCase() : '';
  const ext = PHOTO_EXTS.includes(rawExt) ? rawExt : 'jpg';
  const storagePath = `letters/${picId}.${ext}`;
  const fileRef = ref(storage, storagePath);

  await uploadBytes(fileRef, file, {
    contentType: file.type || 'image/jpeg',
    customMetadata: { picId, letterId, originalName },
  });
  const photoUrl = await getDownloadURL(fileRef);

  return {
    picId,
    photoUrl,
    metadata: {
      picId,
      originalName,
      fileType: getPhotoType(ext),
      size: file.size,
      bucket: fileRef.bucket,
      storagePath,
      uploadedAt: new Date().toISOString(),
    },
  };
}

// Resolve a displayable URL for a stored photo (also handles legacy /api/photos/<id> references)
export async function resolveLetterPhotoUrl(
  picId?: string,
  storagePath?: string,
  currentUrl?: string
): Promise<string> {
  if (currentUrl && !currentUrl.startsWith('/api/')) return currentUrl;
  if (!picId) return '';
  if (storagePath) {
    try {
      return await getDownloadURL(ref(storage, storagePath));
    } catch {
      // fall through to extension probing
    }
  }
  for (const ext of PHOTO_EXTS) {
    try {
      return await getDownloadURL(ref(storage, `letters/${picId}.${ext}`));
    } catch {
      // try next extension
    }
  }
  return '';
}

// Delete Physical Letter Photo by picId from the bucket
export async function deleteLetterPhoto(picId: string, ext?: string): Promise<void> {
  if (!picId) return;
  const cleanExt = ext?.replace(/^\./, '').toLowerCase();
  const exts = cleanExt ? [cleanExt] : PHOTO_EXTS;
  for (const e of exts) {
    try {
      await deleteObject(ref(storage, `letters/${picId}.${e}`));
      return;
    } catch (err: unknown) {
      if ((err as { code?: string })?.code !== 'storage/object-not-found') throw err;
    }
  }
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
