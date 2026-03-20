"use client";

type PhotoModalProps = {
  open: boolean;
  url: string;
  title?: string;
  onClose: () => void;
};

export default function PhotoModal({
  open,
  url,
  title = "사진",
  onClose,
}: PhotoModalProps) {
  if (!open || !url) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] max-w-3xl overflow-auto rounded-2xl bg-white p-2 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-3 py-2">
          <span className="font-medium text-zinc-800">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            닫기
          </button>
        </div>
        <div className="p-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="max-h-[75vh] w-full object-contain"
          />
        </div>
      </div>
    </div>
  );
}
