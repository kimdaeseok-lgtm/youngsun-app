type NewRequestTeamsPayload = {
  requester: string;
  location: string;
  details: string;
  requestPhotoUrl: string;
  adminLink: string;
};

export type TeamsNotifyResult = {
  attempted: boolean;
  ok: boolean;
  sent?: number;
  failed?: number;
  status?: number;
  error?: string;
};

function getWebhookUrl(): string {
  return (process.env.MS_TEAMS_WEBHOOK_URL ?? "").trim();
}

export async function sendTeamsNewRequestMessage(
  payload: NewRequestTeamsPayload
): Promise<TeamsNotifyResult> {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    return {
      attempted: false,
      ok: false,
      error: "MS_TEAMS_WEBHOOK_URL 이 설정되지 않았습니다.",
    };
  }

  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

  // Power Automate HTTP 트리거는 단순 평탄 JSON을 받습니다.
  // 흐름 안에서 triggerBody()?['requester'] 등으로 각 필드를 꺼내 사용하세요.
  const body = {
    requester: payload.requester || "-",
    location: payload.location || "-",
    details: payload.details || "-",
    photoUrl: payload.requestPhotoUrl || "",
    adminLink: payload.adminLink,
    timestamp: now,
  };

  let res: Response;
  try {
    res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      error: e instanceof Error ? e.message : "네트워크 오류",
    };
  }

  // Power Automate는 요청을 큐에 넣고 202 Accepted를 반환합니다. 200·202 모두 성공입니다.
  if (res.status === 200 || res.status === 202) {
    return { attempted: true, ok: true, sent: 1, failed: 0 };
  }

  const resBody = await res.text().catch(() => "");
  return {
    attempted: true,
    ok: false,
    sent: 0,
    failed: 1,
    status: res.status,
    error: resBody || `MS Teams webhook 실패 (HTTP ${res.status})`,
  };
}
