"use client";

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getFirebaseStorage } from "./firebase";

const BUCKET_PREFIX = "youngsun";

export async function uploadRequestPhoto(
  file: File,
  entryId: string
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase가 설정되지 않았습니다. .env.local을 확인하세요.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${BUCKET_PREFIX}/request/${entryId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function uploadActionPhoto(
  file: File,
  entryId: string
): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) throw new Error("Firebase가 설정되지 않았습니다. .env.local을 확인하세요.");
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${BUCKET_PREFIX}/action/${entryId}_${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

