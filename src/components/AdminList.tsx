"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SheetEntry } from "@/types/entry";
import ActionModal from "./ActionModal";
import EditRequestModal from "./EditRequestModal";
import PhotoModal from "./PhotoModal";

type AdminListProps = {
  entries: SheetEntry[];
};

export default function AdminList({ entries }: AdminListProps) {
  const router = useRouter();
  const [actionEntry, setActionEntry] = useState<SheetEntry | null>(null);
  const [editEntry, setEditEntry] = useState<SheetEntry | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [localEntries, setLocalEntries] = useState(entries);

  useEffect(() => {
    setLocalEntries(entries);
  }, [entries]);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setCurrentUserEmail(data?.email ?? ""))
      .catch(() => setCurrentUserEmail(""));
  }, []);

  const pendingEntries = localEntries.filter((e) => !(e.actionTaken ?? "").trim());
  const displayEntries = showCompleted ? localEntries : pendingEntries;

  const openPhoto = (url: string) => {
    setPhotoUrl(url);
  };

  const handleDelete = async (entry: SheetEntry) => {
    if (!window.confirm("이 요청을 삭제하시겠습니까?")) return;
    setDeletingId(entry.id);
    setError("");
    setNotice("");
    try {
      const res = await fetch(`/api/entries/${encodeURIComponent(entry.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "삭제에 실패했습니다.");
      setLocalEntries((prev) => prev.filter((item) => item.id !== entry.id));
      setNotice("요청이 삭제되었습니다.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSuccess = (updatedEntry: SheetEntry) => {
    setLocalEntries((prev) =>
      prev.map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
    );
    setNotice("요청이 수정되었습니다.");
    setEditEntry(null);
    router.refresh();
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">영선 요청 내역</h1>
        <Link
          href="/"
          className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
        >
          메인
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-zinc-500">
            미처리 <span className="font-semibold text-amber-700">{pendingEntries.length}건</span>
            {" · "}전체 {localEntries.length}건
          </p>
          <p className="mt-1 text-xs text-zinc-400">
            본인이 등록한 요청만 수정·삭제할 수 있어요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          {showCompleted ? "미처리만 보기" : "완료 포함 전체 보기"}
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {notice && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-3 py-3 font-medium text-zinc-700">요청일</th>
              <th className="px-3 py-3 font-medium text-zinc-700">요청자</th>
              <th className="px-3 py-3 font-medium text-zinc-700">장소</th>
              <th className="px-3 py-3 font-medium text-zinc-700">내용</th>
              <th className="px-3 py-3 font-medium text-zinc-700">요청사진</th>
              <th className="px-3 py-3 font-medium text-zinc-700">조치</th>
            </tr>
          </thead>
          <tbody>
            {displayEntries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-zinc-500">
                  {showCompleted ? "등록된 요청이 없습니다." : "미처리 요청이 없습니다."}
                </td>
              </tr>
            )}
            {displayEntries.map((e) => {
              const pending = !(e.actionTaken ?? "").trim();
              const canManage = !e.requesterEmail || !currentUserEmail || e.requesterEmail === currentUserEmail;
              return (
                <tr
                  key={e.id}
                  className={
                    pending
                      ? "border-b border-amber-100 bg-amber-50/50"
                      : "border-b border-zinc-100"
                  }
                >
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-800">
                    {e.requestDate || "—"}
                  </td>
                  <td className="px-3 py-3 text-zinc-800">{e.requester || "—"}</td>
                  <td className="px-3 py-3 text-zinc-800">{e.location || "—"}</td>
                  <td className="max-w-[200px] px-3 py-3 text-zinc-700">
                    <span className="line-clamp-3" title={e.details}>
                      {e.details || "—"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    {e.requestPhotoUrl ? (
                      <button
                        type="button"
                        onClick={() => openPhoto(e.requestPhotoUrl)}
                        className="block overflow-hidden rounded-lg ring-1 ring-zinc-200 transition-opacity hover:opacity-75"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.requestPhotoUrl}
                          alt="요청 사진"
                          className="h-14 w-14 object-cover"
                        />
                      </button>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {e.actionTaken ? (
                      <span>
                        {e.actionTaken}
                        {e.actionDate ? ` (${e.actionDate})` : ""}
                      </span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-amber-800">미처리</span>
                        <button
                          type="button"
                          onClick={() => setActionEntry(e)}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white"
                        >
                          조치 입력
                        </button>
                      </div>
                    )}
                    {canManage && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setEditEntry(e)}
                          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(e)}
                          disabled={deletingId === e.id}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50"
                        >
                          {deletingId === e.id ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ActionModal entry={actionEntry} onClose={() => setActionEntry(null)} />
      <EditRequestModal
        entry={editEntry}
        onClose={() => setEditEntry(null)}
        onSaved={handleEditSuccess}
      />
      <PhotoModal
        open={Boolean(photoUrl)}
        url={photoUrl ?? ""}
        title="요청 사진"
        onClose={() => setPhotoUrl(null)}
      />
    </>
  );
}
