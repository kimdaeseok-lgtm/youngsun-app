type NewRequestChatPayload = {
  requester: string;
  location: string;
  details: string;
  requestPhotoUrl: string;
  adminLink: string;
};

export async function sendGoogleChatNewRequestMessage(
  payload: NewRequestChatPayload
): Promise<{ attempted: boolean; ok: boolean; status?: number; error?: string }> {
  const webhookUrl = (process.env.GOOGLE_CHAT_WEBHOOK_URL ?? "").trim();
  if (!webhookUrl) {
    return {
      attempted: false,
      ok: false,
      error: "GOOGLE_CHAT_WEBHOOK_URL is not set",
    };
  }

  const text =
    "🔔 영선 요청 등록\n\n" +
    `- 요청자: ${payload.requester || "-"}\n` +
    `- 장소: ${payload.location || "-"}\n` +
    `- 요청 내용: ${payload.details || "-"}\n` +
    `- 사진 링크: ${payload.requestPhotoUrl || "-"}\n` +
    `- 담당자 화면: ${payload.adminLink || "-"}`;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ text }),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      attempted: true,
      ok: false,
      status: res.status,
      error: body || `Google Chat webhook failed: ${res.status}`,
    };
  }

  return { attempted: true, ok: true, status: res.status };
}
