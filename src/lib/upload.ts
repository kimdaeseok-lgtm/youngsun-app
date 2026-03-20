"use client";

import imageCompression from "browser-image-compression";
import {
  ref,
  getDownloadURL,
  uploadBytesResumable,
  type StorageReference,
} from "firebase/storage";
import {
  getFirebaseStorage,
  ensureAnonymousAuthForStorage,
} from "@/firebase/clientApp";

const BUCKET_PREFIX = "youngsun";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: false,
} as const;

/** 작은 파일은 압축 생략(속도·호환성) */
const SKIP_COMPRESS_MAX_BYTES = 900 * 1024;

const COMPRESS_TIMEOUT_MS = 45_000;
const FIREBASE_TIMEOUT_MS = 90_000;

type UploadOptions = {
  onCompressionStart?: () => void;
  onCompressionEnd?: () => void;
  onUploadStart?: () => void;
};

function getFirebaseErrorCode(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "";
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${message}(${Math.round(ms / 1000)}초 초과). Wi-Fi·VPN을 확인하거나, 잠시 후 다시 시도·사진 없이 제출해 보세요. Firebase Storage 규칙·버킷 이름(NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET)도 확인하세요.`
        )
      );
    }, ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

async function compressImageSafely(file: File): Promise<File> {
  try {
    return await imageCompression(file, COMPRESSION_OPTIONS);
  } catch {
    if (file.size <= 1024 * 1024) {
      return file;
    }
    throw new Error(
      "이미지 압축에 실패했습니다. JPEG/PNG 등 일반 형식이나 더 작은 사진으로 시도해 주세요."
    );
  }
}

async function prepareImageFile(file: File): Promise<File> {
  if (file.size <= SKIP_COMPRESS_MAX_BYTES) {
    return file;
  }
  return compressImageSafely(file);
}

/** 일부 환경에서 uploadBytes가 멈추는 보고가 있어 resumable 사용 */
function uploadBlobResumable(
  storageRef: StorageReference,
  data: Blob
): Promise<void> {
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(storageRef, data);
    task.on(
      "state_changed",
      () => {},
      (err) => reject(err),
      () => resolve()
    );
  });
}

async function uploadCompressed(
  compressed: File,
  folder: "request" | "action",
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  await ensureAnonymousAuthForStorage();

  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error(
      "Firebase Storage를 쓸 수 없습니다. NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET(예: 프로젝트ID.appspot.com)을 확인하세요."
    );
  }

  const ext = compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${BUCKET_PREFIX}/${folder}/${entryId}_${Date.now()}.${safeExt}`;
  const storageRef = ref(storage, path);
  options?.onUploadStart?.();

  try {
    await uploadBlobResumable(storageRef, compressed);
    return await getDownloadURL(storageRef);
  } catch (e: unknown) {
    const code = getFirebaseErrorCode(e);
    if (code === "storage/unauthorized") {
      throw new Error(
        "Storage 업로드가 거부되었습니다. Firebase Console → Storage → 규칙에서 `youngsun/` 경로 쓰기를 허용하고, 필요하면 Authentication에서 익명 로그인을 켜 주세요."
      );
    }
    if (code === "storage/canceled") {
      throw new Error("업로드가 취소되었습니다.");
    }
    if (code === "storage/quota-exceeded") {
      throw new Error("Storage 용량 한도를 초과했습니다.");
    }
    throw e;
  }
}

export async function uploadRequestPhoto(
  file: File,
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  options?.onCompressionStart?.();
  let prepared: File;
  try {
    prepared = await withTimeout(
      prepareImageFile(file),
      COMPRESS_TIMEOUT_MS,
      "이미지 처리 "
    );
  } finally {
    options?.onCompressionEnd?.();
  }

  return withTimeout(
    uploadCompressed(prepared, "request", entryId, options),
    FIREBASE_TIMEOUT_MS,
    "Firebase 업로드 "
  );
}

export async function uploadActionPhoto(
  file: File,
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  options?.onCompressionStart?.();
  let prepared: File;
  try {
    prepared = await withTimeout(
      prepareImageFile(file),
      COMPRESS_TIMEOUT_MS,
      "이미지 처리 "
    );
  } finally {
    options?.onCompressionEnd?.();
  }

  return withTimeout(
    uploadCompressed(prepared, "action", entryId, options),
    FIREBASE_TIMEOUT_MS,
    "Firebase 업로드 "
  );
}
