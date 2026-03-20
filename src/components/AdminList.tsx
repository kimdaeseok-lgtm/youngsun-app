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
  const [photoLabel, setPhotoLabel] = useState("");

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900">영선일지 (담당자)</h1>
        <div className="flex gap-2">
          <Link
            href="/"
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
          >
            메인
          </Link>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
          >
            로그아웃
          </button>
        </div>
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        총 {entries.length}건 · 최신 요청이 위에 표시됩니다.
      </p>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th className="px-3 py-3 font-medium text-zinc-700">요청일</th>
              <th className="px-3 py-3 font-medium text-zinc-700">요청자</th>
              <th className="px-3 py-3 font-medium text-zinc-700">장소</th>
              <th className="px-3 py-3 font-medium text-zinc-700">내용</th>
              <th className="px-3 py-3 font-medium text-zinc-700">사진</th>
              <th className="px-3 py-3 font-medium text-zinc-700">조치</th>
              <th className="px-3 py-3 font-medium text-zinc-700" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-zinc-500"
                >
                  등록된 요청이 없습니다.
                </td>
              </tr>
            )}
            {entries.map((e) => {
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
                        onClick={() => {
                          setPhotoUrl(e.requestPhotoUrl);
                          setPhotoLabel("요청 사진");
                        }}
                        className="text-blue-600 underline"
                      >
                        보기
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-3 py-3 text-zinc-700">
                    {e.actionTaken ? (
                      <span>
                        {e.actionTaken}
                        {e.actionDate ? ` (${e.actionDate})` : ""}
                      </span>
                    ) : (
                      <span className="text-amber-800">미처리</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    {pending ? (
                      <button
                        type="button"
                        onClick={() => setActionEntry(e)}
                        className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white"
                      >
                        조치 입력
                      </button>
                    ) : e.photoView ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPhotoUrl(e.photoView);
                          setPhotoLabel("조치 사진");
                        }}
                        className="text-blue-600 underline"
                      >
                        조치사진
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ActionModal
        entry={actionEntry}
        onClose={() => setActionEntry(null)}
      />
      <PhotoModal
        open={Boolean(photoUrl)}
        url={photoUrl ?? ""}
        title={photoLabel}
        onClose={() => setPhotoUrl(null)}
      />
    </>
  );
}
