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

function getEnvServiceAccount():
  | { projectId: string; clientEmail: string; privateKey: string }
  | null {
  const projectId = (process.env.FIREBASE_PROJECT_ID ?? "").trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL ?? "").trim();
  const privateKeyRaw = (process.env.FIREBASE_PRIVATE_KEY ?? "").trim();
  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  // Vercel/CI에서는 개행이 '\\n'으로 들어오는 경우가 많음
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  return { projectId, clientEmail, privateKey };
}

async function loadServiceAccount(): Promise<admin.ServiceAccount> {
  const env = getEnvServiceAccount();
  if (env) {
    return {
      projectId: env.projectId,
      clientEmail: env.clientEmail,
      privateKey: env.privateKey,
    } as admin.ServiceAccount;
  }

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
  const envProjectId = (process.env.FIREBASE_PROJECT_ID ?? "").trim();
  const serviceAccountProjectId = (serviceAccount.projectId ?? "").trim();
  const projectId = envProjectId || serviceAccountProjectId;
  const storageBucket =
    (process.env.FIREBASE_STORAGE_BUCKET ?? "").trim() ||
    (process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "").trim();

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is not set");
  }
  if (
    envProjectId &&
    serviceAccountProjectId &&
    envProjectId !== serviceAccountProjectId
  ) {
    throw new Error(
      `Firebase Admin service account project_id mismatch. env=${envProjectId} serviceAccount=${serviceAccountProjectId}. ` +
        `Use a service account JSON from the '${envProjectId}' project.`
    );
  }
  if (!storageBucket) {
    throw new Error(
      "FIREBASE_STORAGE_BUCKET (or NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) is not set"
    );
  }

  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId,
    storageBucket,
  });
}

export async function getFirebaseAdminBucket(): Promise<Bucket> {
  const app = await getFirebaseAdminApp();
  return app.storage().bucket() as unknown as Bucket;
}

