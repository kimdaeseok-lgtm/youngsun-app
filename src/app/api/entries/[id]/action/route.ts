import { NextResponse } from "next/server";
import {
  findRowIndexById,
  updateRowAction,
  getRequestContactById,
} from "@/lib/sheets";
import { sendGoogleChatDirectMessage } from "@/lib/googleChat";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 조치 저장 후: 요청자 본인에게 구글 챗 개인 DM으로 조치 내용 알림(실패해도 저장은 성공 처리)
    let chat: Awaited<
      ReturnType<typeof sendGoogleChatDirectMessage>
    > | null = null;
    try {
      const contact = await getRequestContactById(id);
      if (contact?.requesterEmail) {
        const baseUrl =
          process.env.NEXT_PUBLIC_APP_URL ??
          (request.headers.get("x-forwarded-proto") &&
          request.headers.get("host")
            ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("host")}`
            : "");
        const appLink = baseUrl ? baseUrl.replace(/\/$/, "") : "";
        const lines = [
          `${contact.requester ? contact.requester + "님, " : ""}요청하신 건이 조치되었습니다.`,
          "",
          contact.location ? `• 장소: ${contact.location}` : "",
          contact.details ? `• 요청 내용: ${contact.details}` : "",
          `• 조치 내용: ${actionContent || "-"}`,
          `• 조치 날짜: ${actionDate}`,
          remarks ? `• 비고: ${remarks}` : "",
          appLink ? `\n${appLink}` : "",
        ].filter((l) => l !== "");
        chat = await sendGoogleChatDirectMessage({
          email: contact.requesterEmail,
          text: lines.join("\n"),
        });
        // 진단용: 실패 시 Vercel 런타임 로그에 원인 출력
        if (chat && !chat.ok) {
          console.error("Google Chat DM 실패:", JSON.stringify(chat));
        } else if (chat?.ok) {
          console.log("Google Chat DM 발송 성공:", contact.requesterEmail);
        }
      }
    } catch (e) {
      console.error("Google Chat DM send failed:", e);
    }

    return NextResponse.json({ ok: true, chat });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "조치 저장에 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
