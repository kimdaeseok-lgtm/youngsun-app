import admin from "firebase-admin";
import type { Bucket } from "@google-cloud/storage";
import { promises as fs } from "node:fs";
import path from "node:path";

function getServiceAccountPath(): string {
  return (
    (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ?? "").trim() ||
    path.join(process.cwd(), "youngsun-app-key.json")
  );
}

async function loadServiceAccount(): Promise<admin.ServiceAccount> {
  const rawEnv =
    (process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON ?? "").trim() ||
    (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (rawEnv) {
    try {
      return JSON.parse(rawEnv) as admin.ServiceAccount;
    } catch {
      throw new Error(
        "FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON (or GOOGLE_SERVICE_ACCOUNT_JSON) is invalid JSON"
      );
    }
  }

  const p = getServiceAccountPath();
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as admin.ServiceAccount;
}

export async function getFirebaseAdminApp(): Promise<admin.app.App> {
  if (admin.apps.length > 0) return admin.apps[0] as admin.app.App;

  const serviceAccount = await loadServiceAccount();
  const storageBucket =
    (process.env.FIREBASE_STORAGE_BUCKET ?? "").trim() ||
    (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim();

  if (!storageBucket) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET (or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) is not set"
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket,
  });
}

export async function getFirebaseAdminBucket(): Promise<Bucket> {
  const app = await getFirebaseAdminApp();
  return app.storage().bucket() as unknown as Bucket;
}

