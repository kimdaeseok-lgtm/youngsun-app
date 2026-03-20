"use client";

import imageCompression from "browser-image-compression";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "@/firebase/clientApp";

const BUCKET_PREFIX = "youngsun";

/** 모바일·WebView에서 useWebWorker: true 가 무한 대기되는 경우가 있어 false 사용 */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: false,
} as const;

const UPLOAD_TIMEOUT_MS = 120_000;

type UploadOptions = {
  onCompressionStart?: () => void;
  onCompressionEnd?: () => void;
  onUploadStart?: () => void;
};

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          `${message} (${Math.round(ms / 1000)}초 초과). Wi-Fi를 확인하거나, 사진 없이 제출해 보세요.`
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
      "이미지 압축에 실패했습니다. JPEG/PNG 등 일반 형식이나 용량이 더 작은 사진으로 시도해 주세요."
    );
  }
}

async function uploadCompressed(
  compressed: File,
  folder: "request" | "action",
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error(
      "Firebase가 설정되지 않았습니다. NEXT_PUBLIC_FIREBASE_* 를 확인하세요."
    );
  }
  const ext = compressed.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
  const path = `${BUCKET_PREFIX}/${folder}/${entryId}_${Date.now()}.${safeExt}`;
  const storageRef = ref(storage, path);
  options?.onUploadStart?.();
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
}

export async function uploadRequestPhoto(
  file: File,
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  const work = async () => {
    options?.onCompressionStart?.();
    let compressed: File;
    try {
      compressed = await compressImageSafely(file);
    } finally {
      options?.onCompressionEnd?.();
    }
    return uploadCompressed(compressed, "request", entryId, options);
  };
  return withTimeout(work(), UPLOAD_TIMEOUT_MS, "사진 업로드");
}

export async function uploadActionPhoto(
  file: File,
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  const work = async () => {
    options?.onCompressionStart?.();
    let compressed: File;
    try {
      compressed = await compressImageSafely(file);
    } finally {
      options?.onCompressionEnd?.();
    }
    return uploadCompressed(compressed, "action", entryId, options);
  };
  return withTimeout(work(), UPLOAD_TIMEOUT_MS, "사진 업로드");
}
