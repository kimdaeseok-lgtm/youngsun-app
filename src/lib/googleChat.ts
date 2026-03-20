type NewRequestChatPayload = {
  requester: string;
  location: string;
  details: string;
  requestPhotoUrl: string;
  adminLink: string;
};

/** 쉼표·줄바꿈으로 여러 URL 지원 (담당자별 DM/방마다 웹훅이 다를 때) */
function parseWebhookUrls(): string[] {
  const raw =
    (process.env.GOOGLE_CHAT_WEBHOOK_URLS ?? "").trim() ||
    (process.env.GOOGLE_CHAT_WEBHOOK_URL ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter(Boolean);
}

export type ChatNotifyResult = {
  attempted: boolean;
  ok: boolean;
  /** 보낸 웹훅 개수 */
  sent?: number;
  /** 실패한 URL 수 */
  failed?: number;
  status?: number;
  error?: string;
};

export async function sendGoogleChatNewRequestMessage(
  payload: NewRequestChatPayload
): Promise<ChatNotifyResult> {
  const urls = parseWebhookUrls();
  if (urls.length === 0) {
    return {
      attempted: false,
      ok: false,
      error:
        "GOOGLE_CHAT_WEBHOOK_URL 또는 GOOGLE_CHAT_WEBHOOK_URLS 가 설정되지 않았습니다.",
    };
  }

  /** 스페이스에서 @모두 알림 — Incoming Webhook 텍스트 메시지 형식 */
  const text =
    "<users/all> 영선 요청이 접수되었습니다. 확인해 주세요\n\n" +
    `- 요청자: ${payload.requester || "-"}\n` +
    `- 장소: ${payload.location || "-"}\n` +
    `- 요청 내용: ${payload.details || "-"}\n` +
    `- 사진 링크: ${payload.requestPhotoUrl || "-"}\n` +
    `- 담당자 화면: ${payload.adminLink || "-"}`;

  const results = await Promise.all(
    urls.map(async (webhookUrl) => {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ text }),
        cache: "no-store",
      });
      const body = res.ok ? "" : await res.text().catch(() => "");
      return { ok: res.ok, status: res.status, error: body };
    })
  );

  const failed = results.filter((r) => !r.ok);
  const okCount = results.length - failed.length;

  if (failed.length === results.length) {
    const first = failed[0];
    return {
      attempted: true,
      ok: false,
      sent: 0,
      failed: failed.length,
      status: first?.status,
      error:
        first?.error ||
        `Google Chat webhook 전부 실패 (예: HTTP ${first?.status})`,
    };
  }

  return {
    attempted: true,
    ok: true,
    sent: okCount,
    failed: failed.length,
    ...(failed.length > 0 && {
      error: `${failed.length}개 웹훅 실패, ${okCount}개 성공`,
    }),
  };
}
