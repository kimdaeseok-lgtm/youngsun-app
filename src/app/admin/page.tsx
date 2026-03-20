 run devimport { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getEntries } from "@/lib/sheets";
import AdminList from "@/components/AdminList";

export const metadata = {
  title: "담당자 | 영선일지",
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
    // env 미설정
  }
  /** 시트에 마지막 행이 최신이므로 역순으로 표시 */
  const newestFirst = [...entries].reverse();

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AdminList entries={newestFirst} />
      </main>
    </div>
  );
}
