import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getEntries, getPendingEntries } from "@/lib/sheets";
import AdminList from "@/components/AdminList";
import FcmTokenLogger from "@/components/FcmTokenLogger";

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
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-4 py-6">
        <FcmTokenLogger />
        <AdminList entries={pending} />
      </main>
    </div>
  );
}
