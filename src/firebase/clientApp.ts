import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

/** env에 gs:// 접두사가 붙어 있어도 동작하도록 정리 */
function normalizeStorageBucket(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = raw.trim();
  if (!t) return undefined;
  return t.replace(/^gs:\/\//i, "");
}

const storageBucket = normalizeStorageBucket(
  process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: storageBucket ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (getApps().length > 0) return getApps()[0] as FirebaseApp;
  const hasConfig =
    Boolean(firebaseConfig.apiKey) &&
    Boolean(firebaseConfig.authDomain) &&
    Boolean(firebaseConfig.projectId) &&
    Boolean(firebaseConfig.appId) &&
    Boolean(firebaseConfig.storageBucket);
  if (!hasConfig) return null;
  return initializeApp(firebaseConfig);
}

/**
 * Storage 규칙이 `request.auth != null` 인 경우 업로드 전에 필요합니다.
 * 익명 로그인이 꺼져 있으면 조용히 넘어갑니다(규칙이 공개 쓰기면 그대로 업로드 가능).
 */
export async function ensureAnonymousAuthForStorage(): Promise<void> {
  const app = getFirebaseApp();
  if (!app) {
    throw new Error("Firebase가 설정되지 않았습니다. NEXT_PUBLIC_FIREBASE_* 를 확인하세요.");
  }
  const auth = getAuth(app);
  if (auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch (e: unknown) {
    const code =
      e && typeof e === "object" && "code" in e
        ? String((e as { code: string }).code)
        : "";
    if (
      code === "auth/operation-not-allowed" ||
      code === "auth/admin-restricted-operation"
    ) {
      return;
    }
    throw e;
  }
}

export function getFirebaseStorage(): FirebaseStorage | null {
  const app = getFirebaseApp();
  if (!app || !storageBucket) return null;
  try {
    return getStorage(app, `gs://${storageBucket}`);
  } catch {
    return getStorage(app);
  }
}
