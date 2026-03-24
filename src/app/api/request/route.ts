import { NextResponse } from "next/server";
import { appendRequestRow } from "@/lib/sheets";
import { sendTeamsNewRequestMessage } from "@/lib/msTeams";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request: Request) {
  let chat: Awaited<ReturnType<typeof sendTeamsNewRequestMessage>> | null =
    null;
  try {
    const body = await request.json();
    const requester = String(body.requester ?? "").trim();
    const location = String(body.location ?? "").trim();
    const details = String(body.details ?? "").trim();
    const requestPhotoUrl = String(body.requestPhotoUrl ?? "").trim();

    const id = generateId();
    const requestDate = new Date().toISOString().slice(0, 10);

    await appendRequestRow({
      id,
      requestDate,
      requester,
      location,
      details,
      requestPhotoUrl,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (request.headers.get("x-forwarded-proto") && request.headers.get("host")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
        : "http://localhost:3000");
    const adminLink = `${baseUrl.replace(/\/$/, "")}/admin`;

    try {
      chat = await sendTeamsNewRequestMessage({
        requester,
        location,
        details,
        requestPhotoUrl,
        adminLink,
      });
    } catch (e) {
      console.error("MS Teams send failed:", e);
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "요청 접수에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, chat });
}
