import Link from "next/link";
import Image from "next/image";
import BackToCloseHandler from "@/components/BackToCloseHandler";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <BackToCloseHandler />
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-lg px-4 py-4 text-center">
          <h1 className="text-3xl font-bold text-zinc-800">
            영선일지
          </h1>
        </div>
      </header>
      <main className="mx-auto flex max-w-lg flex-col px-4 py-12">
        <div className="flex flex-col gap-4">
          <Link
            href="/request"
            className="flex min-h-[56px] items-center justify-center rounded-2xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            영선 요청하기
          </Link>
          <Link
            href="/admin/login"
            className="flex min-h-[56px] items-center justify-center rounded-2xl bg-green-600 px-6 py-4 text-lg font-semibold text-white hover:bg-green-700"
          >
            담당자 로그인
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
