import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-lg px-4 py-4">
          <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
            영선일지
          </h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-lg flex-col px-4 py-12">
        <div className="flex flex-col gap-4">
          <Link
            href="/request"
            className="flex min-h-[56px] items-center justify-center rounded-2xl bg-zinc-800 px-6 py-4 text-lg font-semibold text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            영선 요청하기
          </Link>
          <Link
            href="/admin/login"
            className="flex min-h-[56px] items-center justify-center rounded-2xl border border-zinc-200 bg-white px-6 py-4 text-lg font-semibold text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            관리자 로그인
          </Link>
        </div>
        <div className="mt-10 flex flex-1 items-end justify-center pb-6">
          <Image
            src="/repair.png"
            alt="영선일지 아이콘"
            width={140}
            height={140}
            priority
            className="opacity-80 drop-shadow-sm dark:opacity-70"
          />
        </div>
      </main>
    </div>
  );
}
