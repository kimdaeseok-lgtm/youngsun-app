"use client";

import { useState } from "react";
import Link from "next/link";
import { uploadRequestPhoto } from "@/lib/upload";

export default function RequestPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    requester: "",
    location: "",
    details: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);
    try {
      let requestPhotoUrl = "";
      const tempId = Math.random().toString(36).slice(2, 10);
      if (photoFile) {
        requestPhotoUrl = await uploadRequestPhoto(photoFile, tempId);
      }

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
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <h1 className="text-3xl font-bold text-zinc-800">
            영선 요청
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 pb-12">
        {success && (
          <div
            role="alert"
            className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5"
          >
            <p className="font-medium text-green-800">
              요청이 접수되었습니다.
            </p>
            <p className="mt-1 text-sm text-green-700">
              담당자에게 메일 알림이 발송되었습니다.
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
                placeholder="예: 박경수, 201호"
                className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                장소
              </span>
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                placeholder="예: 2층 건조기, 별관2호"
                className="min-h-[48px] w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                내용
              </span>
              <textarea
                value={form.details}
                onChange={(e) =>
                  setForm((f) => ({ ...f, details: e.target.value }))
                }
                rows={4}
                placeholder="요청 내용을 입력하세요"
                className="min-h-[120px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-zinc-600">
                사진 (선택) · 모바일에서 카메라 촬영 가능
              </span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium"
              />
              {photoFile && (
                <p className="mt-2 text-sm text-zinc-500">
                  선택: {photoFile.name}
                </p>
              )}
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex h-14 w-full items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "접수 중…" : "요청 제출"}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-zinc-500 underline hover:text-zinc-700"
          >
            메인으로
          </Link>
        </p>
      </main>
    </div>
  );
}
