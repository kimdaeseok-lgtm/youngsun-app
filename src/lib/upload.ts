"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import imageCompression from "browser-image-compression";
import { getFirebaseStorage } from "./firebase";

const BUCKET_PREFIX = "youngsun";
const COMPRESSION_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1280,
  useWebWorker: true,
} as const;

type UploadOptions = {
  onCompressionStart?: () => void;
  onCompressionEnd?: () => void;
};

async function compressImage(file: File): Promise<File> {
  return imageCompression(file, COMPRESSION_OPTIONS);
}

export async function uploadRequestPhoto(
  file: File,
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase가 설정되지 않았습니다. .env.local을 확인하세요.");
  options?.onCompressionStart?.();
  let compressed: File;
  try {
    compressed = await compressImage(file);
  } finally {
    options?.onCompressionEnd?.();
  }
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${BUCKET_PREFIX}/request/${entryId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
}

export async function uploadActionPhoto(
  file: File,
  entryId: string,
  options?: UploadOptions
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase가 설정되지 않았습니다. .env.local을 확인하세요.");
  options?.onCompressionStart?.();
  let compressed: File;
  try {
    compressed = await compressImage(file);
  } finally {
    options?.onCompressionEnd?.();
  }
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${BUCKET_PREFIX}/action/${entryId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, compressed);
  return getDownloadURL(storageRef);
}

