import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";
import "./globals.css";

/** `public/repair.png` 가 없으면 아이콘 메타만 생략 (누락 시 일부 환경에서 500 유발 방지) */
export async function generateMetadata(): Promise<Metadata> {
  const repairPath = path.join(process.cwd(), "public", "repair.png");
  const hasRepair = fs.existsSync(repairPath);
  const metadata: Metadata = {
    title: "영선일지",
    description: "영선 요청 및 조치 관리",
  };
  if (hasRepair) {
    metadata.icons = {
      icon: [{ url: "/repair.png", type: "image/png" }],
      apple: [{ url: "/repair.png" }],
    };
  }
  return metadata;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
