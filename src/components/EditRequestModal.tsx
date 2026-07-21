"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadRequestPhoto } from "@/lib/upload";
import type { SheetEntry } from "@/types/entry";

type EditRequestModalProps = {
  entry: SheetEntry | null;
  onClose: () => void;
  onSaved?: (entry: SheetEntry) => void;
};

export default function EditRequestModal({ entry, onClose, onSaved }: EditRequestModalProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [requester, setRequester] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entry) return;
    setRequester(entry.requester ?? "");
    setLocation(entry.location ?? "");
    setDetails(entry.details ?? "");
    setPhotoFile(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }, [entry?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;

    setError("");
    setLoading(true);
    try {
      let requestPhotoUrl = entry.requestPhotoUrl ?? "";
      if (photoFile) {
        requestPhotoUrl = await uploadRequestPhoto(photoFile, entry.id, {
          onCompressionStart: () => setCompressing(true),
          onCompressionEnd: () => setCompressing(false),
        });
      }

      const res = await fetch(`/api/entries/${encodeURIComponent(entry.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester: requester.trim(),
          location: location.trim(),
          details: details.trim(),
          requestPhotoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "수정에 실패했습니다.");

      onSaved?.({
        ...entry,
        requester: requester.trim(),
        location: location.trim(),
        details: details.trim(),
        requestPhotoUrl,
      });
      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setCompressing(false);
      setLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-request-title"
      >
        <h2 id="edit-request-title" className="text-lg font-bold text-zinc-900">
          요청 수정
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {entry.requestDate || "—"} · {entry.requester || "—"}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">요청자</span>
            <input
              type="text"
              value={requester}
              onChange={(e) => setRequester(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">요청장소</span>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">요청내용</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">요청사진 변경</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
            {photoFile ? (
              <p className="mt-2 text-sm text-zinc-500">{photoFile.name}</p>
            ) : entry.requestPhotoUrl ? (
              <div className="mt-2 overflow-hidden rounded-xl border border-zinc-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={entry.requestPhotoUrl}
                  alt="기존 요청 사진"
                  className="h-32 w-full object-cover"
                />
              </div>
            ) : null}
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-300 py-3 font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-blue-600 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? (compressing ? "압축 중..." : "저장 중…") : "저장"}
            </button>
          </div>
          {compressing && (
            <p
              className="mt-2 flex items-center justify-center gap-2 text-center text-sm font-medium text-zinc-700"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-zinc-600 border-t-transparent" />
              압축 중...
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
