import { getEntries } from "@/lib/sheets";
import AdminList from "@/components/AdminList";

export const metadata = {
  title: "요청 내역 | 영선일지",
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let entries: Awaited<ReturnType<typeof getEntries>> = [];
  try {
    entries = await getEntries();
  } catch {
    // env 미설정
  }
  const newestFirst = [...entries].reverse();

  return (
    <div className="min-h-screen bg-white">
      <main className="mx-auto max-w-4xl px-4 py-6">
        <AdminList entries={newestFirst} />
      </main>
    </div>
  );
}
