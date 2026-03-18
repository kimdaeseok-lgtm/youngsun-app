"use client";

import Image from "next/image";

interface PhotoModalProps {
  url: string;
  onClose: () => void;
}

export default function PhotoModal({ url, onClose }: PhotoModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[90vh] w-full max-w-md overflow-hidden rounded-2xl bg-white">
        <button
          type="button"
          onClick={onClose}
          className="w-full border-b border-zinc-200 px-4 py-2 text-right text-sm text-zinc-500"
        >
          닫기
        </button>
        <div className="flex items-center justify-center bg-black">
          <Image
            src={url}
            alt="요청 사진"
            width={1200}
            height={1200}
            unoptimized
            className="max-h-[80vh] w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

