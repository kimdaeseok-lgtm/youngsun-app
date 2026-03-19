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
    return { attempted: false, ok: false, error: "GOOGLE_CHAT_WEBHOOK_URL is not set" };
  }

  const requester = payload.requester || "-";
  const location = payload.location || "-";
  const details = payload.details || "-";
  const photo = payload.requestPhotoUrl || "-";
  const adminLink = payload.adminLink || "-";

  const text =
    "🔔 영선 요청 등록\n\n" +
    `- 요청자: ${requester}\n` +
    `- 장소: ${location}\n` +
    `- 요청 내용: ${details}\n` +
    `- 사진 링크: ${photo}\n` +
    `- 관리자 화면: ${adminLink}`;

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

