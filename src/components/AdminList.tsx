"use client";

import { useState } from "react";
import Link from "next/link";
import type { SheetEntry } from "@/types/entry";
import ActionModal from "./ActionModal";

export default function AdminList({ entries }: { entries: SheetEntry[] }) {
  const [modalEntry, setModalEntry] = useState<SheetEntry | null>(null);

  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-zinc-500 dark:text-zinc-400">
          조치 대기 중인 요청이 없습니다.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-sm text-zinc-600 underline dark:text-zinc-300"
        >
          메인으로
        </Link>
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
              className="w-full rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:border-zinc-300 hover:shadow dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
                  {entry.id}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  {entry.requestDate}
                </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-100">
                  {entry.requester || "-"}
                </span>
                <span className="text-zinc-600 dark:text-zinc-300">
                  {entry.location || "-"}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                {entry.details || "-"}
              </p>
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
      <p className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm text-zinc-500 underline hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-300"
        >
          메인으로
        </Link>
      </p>
    </>
  );
}
