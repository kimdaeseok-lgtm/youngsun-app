import { NextResponse } from "next/server";
import { writeValues } from "@/lib/sheets";

export async function POST() {
  try {
    await writeValues("A1", [["성공!"]]);
    return NextResponse.json({ ok: true, wrote: "성공!", cell: "A1" });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Google Sheets 테스트에 실패했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

