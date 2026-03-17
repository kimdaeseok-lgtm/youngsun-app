import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getEntries, getPendingEntries } from "@/lib/sheets";
import AdminList from "@/components/AdminList";

export const metadata = {
  title: "담당자 관리 | 영선일지",
  description: "영선일지 조치 관리",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") {
    redirect("/admin/login");
  }

  let entries: Awaited<ReturnType<typeof getEntries>> = [];
  try {
    entries = await getEntries();
  } catch {
    // env 미설정 시 빈 목록
  }
  const pending = getPendingEntries(entries).slice(-10).reverse();

  return (
    <div className="min-h-screen bg-zinc-100 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
              담당자 관리
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              조치사항(G열)이 비어 있는 항목만 표시됩니다. 클릭하여 조치를 입력하세요.
            </p>
          </div>
          <a
            href="/api/admin/logout"
            className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            로그아웃
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AdminList entries={pending} />
      </main>
    </div>
  );
}
