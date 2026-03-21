import fs from "node:fs";
import path from "node:path";
import Link from "next/link";

export default function HomePage() {
  const repairPath = path.join(process.cwd(), "public", "repair.png");
  const hasRepair = fs.existsSync(repairPath);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-4 py-8">
      <div className="flex w-full flex-col items-center gap-8">
        <h1 className="text-2xl font-bold text-zinc-800">영선일지</h1>
        <div className="flex w-full flex-col gap-3">
          <Link
            href="/request"
            className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 text-lg font-semibold text-white"
          >
            영선 요청
          </Link>
          <Link
            href="/admin"
            className="flex h-14 items-center justify-center rounded-2xl bg-green-600 text-lg font-semibold text-white hover:bg-green-500"
          >
            요청 내역
          </Link>
        </div>
        {hasRepair ? (
          // next/image 는 파일이 없을 때 개발 서버에서 500이 날 수 있어 일반 img 사용
          <img
            src="/repair.png"
            alt="영선일지"
            width={176}
            height={176}
            className="h-36 w-36 object-contain sm:h-40 sm:w-40"
          />
        ) : (
          <p className="max-w-xs rounded-xl bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            <strong>public/repair.png</strong> 파일을 프로젝트의{" "}
            <code className="rounded bg-amber-100 px-1">public</code> 폴더에
            넣어 주세요. (탭 아이콘·이미지용)
          </p>
        )}
      </div>
    </main>
  );
}
