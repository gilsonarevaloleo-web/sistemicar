import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged, User, signInAnonymously, linkWithPopup, linkWithRedirect } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore, collection, collectionGroup, doc, getDocs, getDoc, setDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, limit, Timestamp, serverTimestamp, onSnapshot } from "firebase/firestore";

const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA7PN2Bmu46bnMSh6L_WD7esAhdfvFrPv0",
  authDomain: "sistemicar-app.firebaseapp.com",
  projectId: "sistemicar-app",
  storageBucket: "sistemicar-app.firebasestorage.app",
  messagingSenderId: "606312674305",
  appId: "1:606312674305:web:12943997b4a522b9507c00",
} as const;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

const APP_ID = 'sistemicar-v2-5';

export const isFirebaseConfigured = (): boolean => {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (error) {
    console.warn("Firebase initialization failed:", error);
  }
} else {
  console.info("Firebase not configured. Running in DEVELOPMENT MODE with localStorage.");
}

export { app, auth, db };

export const getPrivatePath = (userId: string, collectionName: string) => 
  `artifacts/${APP_ID}/users/${userId}/${collectionName}`;

export const getPublicPath = (collectionName: string) => 
  `artifacts/${APP_ID}/public/data/${collectionName}`;

export const googleProvider = new GoogleAuthProvider();

const isMobile = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const signInWithGoogle = async () => {
  if (!auth) throw new Error("Firebase not configured");
  // Siempre usar popup - los navegadores modernos bloquean cookies de terceros
  // lo que rompe signInWithRedirect en móviles
  return signInWithPopup(auth, googleProvider);
};

export const signInAnonymousUser = async () => {
  if (!auth) throw new Error("Firebase not configured");
  return signInAnonymously(auth);
};

export const linkAnonymousWithGoogle = async () => {
  if (!auth || !auth.currentUser) throw new Error("No user to link");
  if (!auth.currentUser.isAnonymous) throw new Error("User is not anonymous");
  // Siempre usar popup para vincular también
  return linkWithPopup(auth.currentUser, googleProvider);
};

export const checkRedirectResult = async () => {
  if (!auth) return null;
  try {
    return await getRedirectResult(auth);
  } catch (error) {
    console.error("Redirect result error:", error);
    return null;
  }
};

export const isUserAnonymous = (): boolean => {
  return auth?.currentUser?.isAnonymous ?? true;
};

export const getUserEmail = (): string | null => {
  return auth?.currentUser?.email ?? null;
};

export const logOut = async () => {
  if (!auth) throw new Error("Firebase not configured");
  return signOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export { 
  collection,
  collectionGroup,
  doc, 
  getDocs, 
  getDoc,
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  onSnapshot,
  signInAnonymously,
  getRedirectResult
};
export type { User };
