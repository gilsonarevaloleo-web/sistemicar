/** Rutas Firestore privadas (mismo contrato que client/src/lib/firebase.ts). */
export const FIREBASE_APP_ID = "sistemicar-v2-5";

export function getPrivatePath(userId: string, collectionName: string): string {
  return `artifacts/${FIREBASE_APP_ID}/users/${userId}/${collectionName}`;
}
