"use client";

import { useState } from "react";
import Link from "next/link";
import type { SheetEntry } from "@/types/entry";
import ActionModal from "./ActionModal";
import PhotoModal from "./PhotoModal";

type AdminListProps = {
  entries: SheetEntry[];
};

export default function AdminList({ entries }: AdminListProps) {
  const [actionEntry, setActionEntry] = useState<SheetEntry | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const pendingEntries = entries.filter((e) => !(e.actionTaken ?? "").trim());
  const displayEntries = showCompleted ? entries : pendingEntries;

  const openPhoto = (url: string) => {
    setPhotoUrl(url);
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
        <p className="text-sm text-zinc-500">
          미처리 <span className="font-semibold text-amber-700">{pendingEntries.length}건</span>
          {" · "}전체 {entries.length}건
        </p>
        <button
          type="button"
          onClick={() => setShowCompleted((v) => !v)}
          className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
        >
          {showCompleted ? "미처리만 보기" : "완료 포함 전체 보기"}
        </button>
      </div>

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
                      <div className="flex items-center gap-2">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ActionModal entry={actionEntry} onClose={() => setActionEntry(null)} />
      <PhotoModal
        open={Boolean(photoUrl)}
        url={photoUrl ?? ""}
        title="요청 사진"
        onClose={() => setPhotoUrl(null)}
      />
    </>
  );
}
