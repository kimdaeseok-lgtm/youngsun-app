import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findRowIndexById, updateRowAction } from "@/lib/sheets";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const actionContent = String(body.actionContent ?? "").trim();
    const actionPhotoUrl = String(body.actionPhotoUrl ?? "").trim();
    const remarks = String(body.remarks ?? "").trim();
    const actionDate =
      String(body.actionDate ?? "").trim() ||
      new Date().toISOString().slice(0, 10);

    const rowIndex = await findRowIndexById(id);
    if (rowIndex == null) {
      return NextResponse.json(
        { error: "해당 항목을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await updateRowAction(
      rowIndex,
      actionContent,
      actionDate,
      remarks,
      actionPhotoUrl
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "조치 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
