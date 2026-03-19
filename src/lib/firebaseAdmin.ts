import admin from "firebase-admin";
import type { Bucket } from "@google-cloud/storage";

/** Firebase Admin SDK는 FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY 3개 env로만 초기화합니다. */
function decodePrivateKeyFromEnv(raw: string): string {
  // Vercel: 값에 리터럴 \n(백슬래시+n) 또는 실제 개행이 올 수 있음. JSON.parse로 확실히 복원.
  const trimmed = raw.trim().replace(/^["']|["']$/g, "");
  // 1) 리터럴 \n, \r을 실제 개행으로 (env에 \n 형태로 넣은 경우)
  const withNewlines = trimmed.replace(/\\n/g, "\n").replace(/\\r/g, "\r");
  // 2) JSON 문자열로 이스케이프 후 파싱 → PEM에 필요한 실제 \n 확보
  const escaped = withNewlines
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
  return JSON.parse(`"${escaped}"`) as string;
}

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

  const privateKey = decodePrivateKeyFromEnv(privateKeyRaw);
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

