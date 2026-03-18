import admin from "firebase-admin";
import type { Bucket } from "@google-cloud/storage";

function getEnvServiceAccount(): {
  projectId: string;
  clientEmail: string;
  privateKey: string;
} {
  const projectId = (process.env.FIREBASE_PROJECT_ID ?? "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL ?? "").trim();
  const privateKeyRaw = (process.env.FIREBASE_PRIVATE_KEY ?? "").trim();
  if (!projectId) throw new Error("FIREBASE_PROJECT_ID is not set");
  if (!clientEmail) throw new Error("FIREBASE_CLIENT_EMAIL is not set");
  if (!privateKeyRaw) throw new Error("FIREBASE_PRIVATE_KEY is not set");

  // Vercel/CI에서는 개행이 '\\n'으로 들어오는 경우가 많음
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

export async function getFirebaseAdminApp(): Promise<admin.app.App> {
  if (admin.apps.length > 0) return admin.apps[0] as admin.app.App;

  const { projectId, clientEmail, privateKey } = getEnvServiceAccount();
  const storageBucket =
    (process.env.FIREBASE_STORAGE_BUCKET ?? "").trim() ||
    (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim();

  if (!storageBucket) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET (or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) is not set"
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
    storageBucket,
  });
}

export async function getFirebaseAdminBucket(): Promise<Bucket> {
  const app = await getFirebaseAdminApp();
  return app.storage().bucket() as unknown as Bucket;
}

