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

  const facts = [
    { name: "요청자", value: payload.requester || "-" },
    { name: "장소", value: payload.location || "-" },
    { name: "요청 내용", value: payload.details || "-" },
    { name: "접수 시각", value: now },
  ];

  const bodyItems: object[] = [
    {
      type: "TextBlock",
      text: "영선일지 새 요청이 접수되었습니다.",
      weight: "Bolder",
      size: "Medium",
      wrap: true,
    },
    {
      type: "FactSet",
      facts,
    },
  ];

  if (payload.requestPhotoUrl) {
    bodyItems.push({
      type: "Image",
      url: payload.requestPhotoUrl,
      altText: "요청 사진",
      size: "Large",
    });
  }

  bodyItems.push({
    type: "ActionSet",
    actions: [
      {
        type: "Action.OpenUrl",
        title: "담당자 화면 열기",
        url: payload.adminLink,
      },
    ],
  });

  const adaptiveCard = {
    type: "AdaptiveCard",
    version: "1.4",
    body: bodyItems,
    $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
  };

  const message = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: adaptiveCard,
      },
    ],
  };

  let res: Response;
  try {
    res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(message),
      cache: "no-store",
    });
  } catch (e) {
    return {
      attempted: true,
      ok: false,
      error: e instanceof Error ? e.message : "네트워크 오류",
    };
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      attempted: true,
      ok: false,
      sent: 0,
      failed: 1,
      status: res.status,
      error: body || `MS Teams webhook 실패 (HTTP ${res.status})`,
    };
  }

  return { attempted: true, ok: true, sent: 1, failed: 0 };
}
