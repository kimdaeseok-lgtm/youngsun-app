"use client";

import { useState } from "react";
import type { SheetEntry } from "@/types/entry";
import { uploadActionPhoto } from "@/lib/upload";

const today = () => new Date().toISOString().slice(0, 10);
const ACTION_OPTIONS = ["접수", "수리완료", "교체완료", "이상없음", "대기"] as const;

export default function ActionModal({
  entry,
  onClose,
  onSuccess,
}: {
  entry: SheetEntry;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");
  const [actionContent, setActionContent] = useState<(typeof ACTION_OPTIONS)[number] | "">("");
  const [actionDate, setActionDate] = useState(today());
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let actionPhotoUrl = "";
      if (photoFile) {
        actionPhotoUrl = await uploadActionPhoto(photoFile, entry.id, {
          onCompressionStart: () => setCompressing(true),
          onCompressionEnd: () => setCompressing(false),
        });
      }

      const res = await fetch(`/api/entries/${entry.id}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionContent: actionContent.trim(),
          actionPhotoUrl,
          actionDate: actionDate || today(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장에 실패했습니다.");

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setCompressing(false);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-800">
            조치 입력
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            연번 {entry.id} · {entry.requester} · {entry.location}
          </p>
          <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
            {entry.details}
          </p>
        </div>
        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-600">
                조치내용
              </span>
              <select
                value={actionContent}
                onChange={(e) =>
                  setActionContent(
                    (e.target.value as (typeof ACTION_OPTIONS)[number] | "") ?? ""
                  )
                }
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              >
                <option value="" disabled>
                  선택하세요
                </option>
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-600">
                조치후사진 (선택)
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium"
              />
              {photoFile && (
                <p className="mt-1 text-xs text-zinc-500">
                  선택: {photoFile.name}
                </p>
              )}
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-zinc-600">
                조치날짜
              </span>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>
          </div>
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-zinc-300 bg-white py-3 text-zinc-700"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-zinc-800 py-3 font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              {loading ? "저장 중…" : "저장"}
            </button>
          </div>
          {compressing && (
            <p className="mt-3 text-center text-sm text-zinc-500">
              이미지 압축 중...
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
