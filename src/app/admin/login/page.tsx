"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "로그인 실패");
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center bg-white px-4">
      <h1 className="mb-6 text-center text-2xl font-bold text-zinc-900">
        담당자 로그인
      </h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        <label className="block">
          <span className="text-sm font-medium text-zinc-600">비밀번호</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900"
            autoComplete="current-password"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-600 py-3 font-semibold text-white hover:bg-green-500 disabled:opacity-50"
        >
          {loading ? "확인 중…" : "로그인"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-zinc-500">
        <Link href="/" className="underline underline-offset-2 hover:text-zinc-700">
          메인으로
        </Link>
      </p>
    </main>
  );
}
