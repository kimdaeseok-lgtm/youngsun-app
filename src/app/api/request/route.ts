import { NextResponse } from "next/server";
import { appendRequestRow } from "@/lib/sheets";
import { sendNewRequestNotification } from "@/lib/email";
import { sendNewRequestPushNotification } from "@/lib/push";

function generateId(): string {
  return Math.random().toString(36).slice(2, 10);
}

export async function POST(request: Request) {
  let push: Awaited<ReturnType<typeof sendNewRequestPushNotification>> | null =
    null;
  let pushError: string | null = null;
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
    const viewLink = baseUrl.replace(/\/$/, "");

    try {
      push = await sendNewRequestPushNotification({ viewLink });
    } catch (pushErr) {
      console.error("FCM push send failed:", pushErr);
      pushError = pushErr instanceof Error ? pushErr.message : "unknown";
    }

    try {
      await sendNewRequestNotification(
        requester,
        location,
        details,
        requestPhotoUrl,
        viewLink
      );
    } catch (mailErr) {
      console.error("Email send failed:", mailErr);
    }
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "요청 접수에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, push, pushError });
}
