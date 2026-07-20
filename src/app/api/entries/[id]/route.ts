import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { findRowIndexById, updateRequestRow, deleteRequestRow, getRequestContactById } from "@/lib/sheets";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const requester = String(body.requester ?? "").trim();
    const location = String(body.location ?? "").trim();
    const details = String(body.details ?? "").trim();
    const requestPhotoUrl = String(body.requestPhotoUrl ?? "").trim();

    const secret = process.env.AUTH_SECRET ?? "";
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token, secret);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const rowIndex = await findRowIndexById(id);
    if (rowIndex == null) {
      return NextResponse.json({ error: "해당 항목을 찾을 수 없습니다." }, { status: 404 });
    }

    const contact = await getRequestContactById(id);
    if (contact?.requesterEmail && session.email && contact.requesterEmail !== session.email) {
      return NextResponse.json({ error: "본인 요청만 수정할 수 있습니다." }, { status: 403 });
    }

    await updateRequestRow(rowIndex, {
      requester,
      location,
      details,
      requestPhotoUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "수정에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const secret = process.env.AUTH_SECRET ?? "";
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token, secret);
    if (!session) {
      return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    }

    const rowIndex = await findRowIndexById(id);
    if (rowIndex == null) {
      return NextResponse.json({ error: "해당 항목을 찾을 수 없습니다." }, { status: 404 });
    }

    const contact = await getRequestContactById(id);
    if (contact?.requesterEmail && session.email && contact.requesterEmail !== session.email) {
      return NextResponse.json({ error: "본인 요청만 삭제할 수 있습니다." }, { status: 403 });
    }

    await deleteRequestRow(rowIndex);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "삭제에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
