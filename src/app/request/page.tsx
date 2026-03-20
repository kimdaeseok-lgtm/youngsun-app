"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { uploadRequestPhoto } from "@/lib/upload";

export default function RequestPage() {
  const [loading, setLoading] = useState(false);
  /** 사진 있을 때: compress → upload → api 순서 안내 */
  const [progress, setProgress] = useState<
    null | "compress" | "upload" | "submit"
  >(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successDetail, setSuccessDetail] = useState("");
  const [form, setForm] = useState({
    requester: "",
    location: "",
    details: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    setProgress(null);
    try {
      let requestPhotoUrl = "";
      const tempId = Math.random().toString(36).slice(2, 10);
      if (photoFile) {
        requestPhotoUrl = await uploadRequestPhoto(photoFile, tempId, {
          onCompressionStart: () => setProgress("compress"),
          onCompressionEnd: () => setProgress("upload"),
        });
      }

      setProgress("submit");
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requester: form.requester.trim(),
          location: form.location.trim(),
          details: form.details.trim(),
          requestPhotoUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "요청 접수에 실패했습니다.");

      setForm({ requester: "", location: "", details: "" });
      setPhotoFile(null);
      if (data?.chat?.attempted) {
        setSuccessDetail(
          data?.chat?.ok
            ? "요청이 접수되었고 Google Chat 알림이 전송되었습니다."
            : `요청은 접수되었지만 Google Chat 알림 전송에 실패했습니다. ${data?.chat?.error ?? ""}`
        );
      } else {
        setSuccessDetail(
          "요청이 접수되었습니다. (GOOGLE_CHAT_WEBHOOK_URL 설정 시 알림이 전송됩니다.)"
        );
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setProgress(null);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <h1 className="text-3xl font-bold text-zinc-800">영선 요청</h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-12">
        {success && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5"
          >
            <p className="font-medium text-green-800">요청이 접수되었습니다.</p>
            <p className="mt-1 text-sm text-green-700">
              {successDetail || "담당자에게 알림이 전송되었습니다."}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
        >
          {error && (
            <div
              role="alert"
              className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                요청자
              </span>
              <input
                type="text"
                value={form.requester}
                onChange={(e) =>
                  setForm((f) => ({ ...f, requester: e.target.value }))
                }
                className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                요청장소
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                요청내용
              </span>
              <textarea
                value={form.details}
                onChange={(e) =>
                  setForm((f) => ({ ...f, details: e.target.value }))
                }
                rows={4}
                className="min-h-[120px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                요청사항사진 (선택)
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white text-sm font-medium"
                >
                  카메라
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-11 flex-1 items-center justify-center rounded-xl border border-zinc-300 bg-white text-sm font-medium"
                >
                  파일 선택
                </button>
              </div>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="hidden"
              />
              {photoFile && (
                <p className="mt-2 text-sm text-zinc-500">{photoFile.name}</p>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white disabled:opacity-50"
          >
            {loading
              ? progress === "compress"
                ? "압축 중..."
                : progress === "upload"
                  ? "사진 업로드 중…"
                  : progress === "submit"
                    ? "요청 접수 중…"
                    : "접수 중…"
              : "요청 제출"}
          </button>
          {loading && progress === "compress" && (
            <p
              className="mt-3 flex items-center justify-center gap-2 text-center text-sm font-medium text-blue-700"
              role="status"
              aria-live="polite"
            >
              <span className="inline-block size-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              압축 중...
            </p>
          )}
          {loading && progress && progress !== "compress" && (
            <p className="mt-2 text-center text-sm text-zinc-500">
              {progress === "upload" && "Firebase에 사진을 올리는 중입니다."}
              {progress === "submit" && "서버에 요청을 등록하는 중입니다."}
            </p>
          )}
        </form>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-zinc-500 underline">
            메인으로
          </Link>
        </p>
      </main>
    </div>
  );
}
