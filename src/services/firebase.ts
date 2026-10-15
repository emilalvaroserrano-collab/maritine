/**
 * Firebase Client Initialization & Authentication
 * Supports Firestore persistence and Google Workspace OAuth scopes
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc,
  deleteDoc
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with specific database ID from config
export const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);

// Configure Google Auth Provider with all requested Workspace scopes
export const googleProvider = new GoogleAuthProvider();

export const WORKSPACE_SCOPES = [
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events'
];

WORKSPACE_SCOPES.forEach((scope) => {
  googleProvider.addScope(scope);
});

// Prompt consent to ensure refresh & access tokens for all workspace APIs
googleProvider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// In-Memory Token Cache (MANDATORY: Never store in localStorage/sessionStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Test Firestore Connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: any) {
    if (error?.message?.includes('the client is offline')) {
      console.warn('Firestore client is offline or network issue');
    }
    return false;
  }
}

// Error Handler interface conforming to skill specification
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Auth State Listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google (Captures access token in memory)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (!credential?.accessToken) {
      console.warn('Google credential did not return an access token');
    }

    cachedAccessToken = credential?.accessToken || null;
    
    // Save/Update user profile in Firestore
    if (result.user) {
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          userId: result.user.uid,
          email: result.user.email || '',
          displayName: result.user.displayName || 'Mariner',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn('Could not save user profile to firestore:', err);
      }
    }

    return { user: result.user, accessToken: cachedAccessToken || '' };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string | null) => {
  cachedAccessToken = token;
};

export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ============ FIRESTORE PERSISTENCE HELPERS ============

export interface SavedFoodPlanDoc {
  id: string;
  userId: string;
  vesselName: string;
  crewCount: number;
  durationDays: number;
  budgetTotal: number;
  currency: string;
  nationalities: string;
  planJson: string;
  createdAt: string;
}

export async function saveFoodPlanToFirestore(plan: Omit<SavedFoodPlanDoc, 'id' | 'createdAt'>): Promise<string> {
  if (!auth.currentUser) throw new Error('User must be signed in to save food plans');
  const path = 'food_plans';
  try {
    const colRef = collection(db, path);
    const docRef = await addDoc(colRef, {
      ...plan,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function loadFoodPlansFromFirestore(): Promise<SavedFoodPlanDoc[]> {
  if (!auth.currentUser) return [];
  const path = 'food_plans';
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('userId', '==', auth.currentUser.uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as SavedFoodPlanDoc));
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, path);
  }
}
