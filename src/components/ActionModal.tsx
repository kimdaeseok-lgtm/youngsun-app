"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadActionPhoto } from "@/lib/upload";
import type { SheetEntry } from "@/types/entry";

const ACTION_PRESETS = ["수리완료", "교체완료", "이상없음"] as const;

type ActionModalProps = {
  entry: SheetEntry | null;
  onClose: () => void;
};

export default function ActionModal({ entry, onClose }: ActionModalProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [actionContent, setActionContent] = useState("");
  const [customAction, setCustomAction] = useState("");
  const [actionDate, setActionDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [remarks, setRemarks] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!entry) return;
    setActionContent("");
    setCustomAction("");
    setActionDate(new Date().toISOString().slice(0, 10));
    setRemarks("");
    setPhotoFile(null);
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }, [entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps -- 행 id 변경 시에만 초기화

  const effectiveAction =
    actionContent === "기타" ? customAction.trim() : actionContent.trim();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry) return;
    if (!effectiveAction) {
      setError("조치사항을 선택하거나 입력해 주세요.");
      return;
    }
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

      const res = await fetch(`/api/entries/${encodeURIComponent(entry.id)}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionContent: effectiveAction,
          actionDate,
          remarks: remarks.trim(),
          actionPhotoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장 실패");

      onClose();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
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
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-modal-title"
      >
        <h2 id="action-modal-title" className="text-lg font-bold text-zinc-900">
          조치 입력
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {entry.requester} · {entry.location}
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <label className="block">
            <span className="text-sm font-medium text-zinc-600">조치사항</span>
            <select
              value={actionContent}
              onChange={(e) => setActionContent(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            >
              <option value="">선택</option>
              {ACTION_PRESETS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="기타">기타 (직접 입력)</option>
            </select>
          </label>

          {actionContent === "기타" && (
            <label className="block">
              <span className="text-sm text-zinc-600">조치 내용</span>
              <input
                type="text"
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
              />
            </label>
          )}

          <label className="block">
            <span className="text-sm text-zinc-600">조치날짜</span>
            <input
              type="date"
              value={actionDate}
              onChange={(e) => setActionDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-600">비고</span>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-xl border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-600">조치 후 사진 (선택)</span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
              className="mt-1 w-full text-sm"
            />
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
              className="flex-1 rounded-xl bg-zinc-800 py-3 font-medium text-white disabled:opacity-50"
            >
              {loading ? "저장 중…" : "저장"}
            </button>
          </div>
          {compressing && (
            <p className="text-center text-sm text-zinc-500">이미지 압축 중…</p>
          )}
        </form>
      </div>
    </div>
  );
}
