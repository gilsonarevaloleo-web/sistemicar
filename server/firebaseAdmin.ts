import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getPrivatePath } from "../shared/firebasePaths";

let app: App | null = null;

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw?.trim()) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    console.warn("[firebaseAdmin] FIREBASE_SERVICE_ACCOUNT_JSON inv�lido");
    return null;
  }
}

export function isFirebaseAdminReady(): boolean {
  return Boolean(parseServiceAccount());
}

export function getAdminApp(): App | null {
  if (app) return app;
  const sa = parseServiceAccount();
  if (!sa) return null;
  try {
    app = getApps().length
      ? getApps()[0]!
      : initializeApp({ credential: cert(sa as Parameters<typeof cert>[0]) });
    return app;
  } catch (err) {
    console.warn("[firebaseAdmin] No se pudo inicializar:", err);
    return null;
  }
}

export async function lookupUidByEmail(email: string): Promise<string | null> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return null;

  const adminApp = getAdminApp();
  if (adminApp) {
    try {
      const user = await getAuth(adminApp).getUserByEmail(normalized);
      return user.uid;
    } catch {
      return null;
    }
  }

  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return null;
  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: [normalized] }),
      }
    );
    if (!r.ok) return null;
    const data = (await r.json()) as { users?: { localId?: string }[] };
    return data.users?.[0]?.localId ?? null;
  } catch {
    return null;
  }
}

/** Suma cr�ditos en Firestore (colecci�n espejoCredits). Requiere Admin SDK. */
export async function addEspejoCreditsForUser(
  userId: string,
  creditsToAdd: number
): Promise<boolean> {
  const adminApp = getAdminApp();
  if (!adminApp || creditsToAdd <= 0) return false;

  const db = getFirestore(adminApp);
  const collPath = getPrivatePath(userId, "espejoCredits");
  const collRef = db.collection(collPath);
  const snap = await collRef.limit(1).get();

  if (snap.empty) {
    await collRef.add({
      credits: creditsToAdd,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    const docRef = snap.docs[0].ref;
    const current = (snap.docs[0].data().credits as number) || 0;
    await docRef.update({
      credits: current + creditsToAdd,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return true;
}

export async function getEspejoCreditsForUser(userId: string): Promise<number | null> {
  const adminApp = getAdminApp();
  if (!adminApp) return null;
  const db = getFirestore(adminApp);
  const snap = await db.collection(getPrivatePath(userId, "espejoCredits")).limit(1).get();
  if (snap.empty) return 0;
  return (snap.docs[0].data().credits as number) || 0;
}

/** Establece el saldo total de cr�ditos (no suma). */
export async function setEspejoCreditsForUser(
  userId: string,
  credits: number
): Promise<boolean> {
  const adminApp = getAdminApp();
  if (!adminApp || credits < 0) return false;
  const db = getFirestore(adminApp);
  const collRef = db.collection(getPrivatePath(userId, "espejoCredits"));
  const snap = await collRef.limit(1).get();
  if (snap.empty) {
    await collRef.add({ credits, updatedAt: FieldValue.serverTimestamp() });
  } else {
    await snap.docs[0].ref.update({
      credits,
      updatedAt: FieldValue.serverTimestamp(),
    });
  }
  return true;
}
