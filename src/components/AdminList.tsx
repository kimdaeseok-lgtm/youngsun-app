"use client";

import { useState } from "react";
import Link from "next/link";
import type { SheetEntry } from "@/types/entry";
import ActionModal from "./ActionModal";
import PhotoModal from "./PhotoModal";

export default function AdminList({ entries }: { entries: SheetEntry[] }) {
  const [modalEntry, setModalEntry] = useState<SheetEntry | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <p className="text-zinc-500">
          조치 대기 중인 요청이 없습니다.
        </p>
        <p className="mt-4">
          <Link
            href="/"
            className="text-sm text-zinc-600 underline hover:text-zinc-700"
          >
            메인으로
          </Link>
          <span className="mx-2 text-zinc-400">·</span>
          <a
            href="/api/admin/logout"
            className="text-sm text-zinc-600 underline hover:text-zinc-700"
          >
            로그아웃
          </a>
        </p>
      </div>
    );
  }

  return (
    <>
      <ul className="space-y-2">
        {entries.map((entry, idx) => (
          <li key={`${entry.id}-${idx}`}>
            <button
              type="button"
              onClick={() => setModalEntry(entry)}
              className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-sm text-zinc-500">
                  {entry.id}
                </span>
                <span className="text-sm text-zinc-500">
                  {entry.requestDate}
                </span>
                <span className="font-medium text-zinc-800">
                  {entry.requester || "-"}
                </span>
                <span className="text-zinc-600">
                  {entry.location || "-"}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600">
                {entry.details || "-"}
              </p>
              {entry.requestPhotoUrl && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoUrl(entry.requestPhotoUrl);
                  }}
                  className="mt-3 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-200"
                >
                  사진 보기
                </button>
              )}
            </button>
          </li>
        ))}
      </ul>
      {modalEntry && (
        <ActionModal
          entry={modalEntry}
          onClose={() => setModalEntry(null)}
          onSuccess={() => {
            setModalEntry(null);
            window.location.reload();
          }}
        />
      )}
      {photoUrl && (
        <PhotoModal
          url={photoUrl}
          onClose={() => setPhotoUrl(null)}
        />
      )}
      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-zinc-500 underline hover:text-zinc-700"
        >
          메인으로
        </Link>
        <span className="mx-2 text-zinc-400">·</span>
        <a
          href="/api/admin/logout"
          className="text-sm text-zinc-500 underline hover:text-zinc-700"
        >
          로그아웃
        </a>
      </p>
    </>
  );
}
