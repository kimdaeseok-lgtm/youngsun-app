import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { appendRequestRow } from "@/lib/sheets";
import { sendGoogleChatNewRequestMessage } from "@/lib/googleChat";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request: Request) {
  let chat: Awaited<ReturnType<typeof sendGoogleChatNewRequestMessage>> | null =
    null;
  try {
    const body = await request.json();
    const location = String(body.location ?? "").trim();
    const details = String(body.details ?? "").trim();
    const requestPhotoUrl = String(body.requestPhotoUrl ?? "").trim();

    // 로그인 세션에서 요청자 이메일/이름을 신뢰값으로 확보(조치 완료 DM 발송용)
    const secret = process.env.AUTH_SECRET ?? "";
    const token = (await cookies()).get(SESSION_COOKIE)?.value;
    const session = await verifySessionToken(token, secret);
    const requesterEmail = session?.email ?? "";
    // 표시 이름: 폼 입력값 우선, 없으면 세션 이름
    const requester =
      String(body.requester ?? "").trim() || (session?.name ?? "").trim();

    const id = generateId();
    const requestDate = new Date().toISOString().slice(0, 10);

    await appendRequestRow({
      id,
      requestDate,
      requester,
      location,
      details,
      requestPhotoUrl,
      requesterEmail,
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (request.headers.get("x-forwarded-proto") && request.headers.get("host")
        ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
        : "http://localhost:3000");
    const adminLink = `${baseUrl.replace(/\/$/, "")}/admin`;

    try {
      chat = await sendGoogleChatNewRequestMessage({
        requester,
        location,
        details,
        requestPhotoUrl,
        adminLink,
      });
    } catch (e) {
      console.error("Google Chat send failed:", e);
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "요청 접수에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, chat });
}
