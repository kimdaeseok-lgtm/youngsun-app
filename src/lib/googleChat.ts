import { google } from "googleapis";
import { loadServiceAccountCredentials } from "@/lib/sheets";

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

  const infoText =
    `요청자: ${payload.requester || "-"}\n` +
    `장소: ${payload.location || "-"}\n` +
    `요청 내용: ${payload.details || "-"}\n` +
    `<a href="${payload.adminLink}">담당자 화면</a>`;

  const widgets: object[] = [
    {
      textParagraph: {
        text: `<users/all> <b>영선 요청이 접수되었습니다.</b>`,
      },
    },
    {
      textParagraph: { text: infoText },
    },
  ];

  if (payload.requestPhotoUrl) {
    widgets.push({
      image: {
        imageUrl: payload.requestPhotoUrl,
        altText: "요청 사진",
      },
    });
  }

  const message = {
    cardsV2: [
      {
        cardId: "new-request",
        card: {
          header: {
            title: "새 영선 요청",
            subtitle: new Date().toLocaleString("ko-KR", {
              timeZone: "Asia/Seoul",
            }),
          },
          sections: [{ widgets }],
        },
      },
    ],
  };

  const results = await Promise.all(
    urls.map(async (webhookUrl) => {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(message),
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

/**
 * 조치 완료를 '요청자 본인에게' 구글 챗 개인 DM으로 발송.
 * - 시트에 쓰는 서비스계정을 그대로 챗 앱(봇)으로 사용(scope=chat.bot).
 * - 흐름: findDirectMessage(users/{email})로 DM 방을 찾고 → messages.create로 메시지 전송.
 * - 저장을 막지 않도록 실패해도 예외를 던지지 않고 결과 객체로 반환.
 * ※ 사전 설정(구글 클라우드): Chat API 사용 설정 + 앱(봇) 구성 + 조직에 앱 노출/DM 허용.
 */
export async function sendGoogleChatDirectMessage(params: {
  email: string;
  text: string;
}): Promise<ChatNotifyResult> {
  const email = (params.email ?? "").trim();
  const text = (params.text ?? "").trim();
  if (!email) {
    return { attempted: false, ok: false, error: "요청자 이메일이 없습니다(로그인 이전에 접수된 요청일 수 있음)." };
  }
  try {
    // 앱(서비스계정) 인증은 이메일 별칭으로 사용자를 못 찾음 → 먼저 디렉터리에서 숫자 ID로 변환
    const userId = await resolveChatUserId(email);
    if (!userId) {
      return { attempted: true, ok: false, error: `사용자 ID를 찾지 못했습니다(디렉터리 조회 실패): ${email}` };
    }
    const credentials = await loadServiceAccountCredentials();
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/chat.bot"],
    });
    const chat = google.chat({ version: "v1", auth });

    // 1) 요청자와의 DM 방 찾기(숫자 사용자 ID)
    const dm = await chat.spaces.findDirectMessage({ name: `users/${userId}` });
    const space = dm.data?.name;
    if (!space) {
      return { attempted: true, ok: false, error: "DM 방을 찾지 못했습니다(앱이 사용자에게 DM 가능하도록 설정 필요)." };
    }

    // 2) 메시지 전송
    await chat.spaces.messages.create({
      parent: space,
      requestBody: { text },
    });
    return { attempted: true, ok: true, sent: 1, failed: 0 };
  } catch (e) {
    const err = e as { code?: number; message?: string };
    return {
      attempted: true,
      ok: false,
      status: err?.code,
      error: err?.message || "구글 챗 DM 전송 실패",
    };
  }
}

/**
 * 이메일 → 구글 챗 사용자 숫자 ID.
 * 앱(서비스계정) 인증은 이메일로 사용자를 못 찾으므로, Admin SDK Directory API로 조회한다.
 * 도메인 전체 위임(DWD)으로 관리자(GOOGLE_ADMIN_EMAIL)를 가장해 users.get(email) → id.
 */
async function resolveChatUserId(email: string): Promise<string | null> {
  const adminEmail = (process.env.GOOGLE_ADMIN_EMAIL ?? "").trim();
  if (!adminEmail) {
    throw new Error(
      "GOOGLE_ADMIN_EMAIL 미설정: 디렉터리 조회에 사용할 관리자 이메일이 필요합니다."
    );
  }
  const creds = (await loadServiceAccountCredentials()) as {
    client_email: string;
    private_key: string;
  };
  const jwt = new google.auth.JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ["https://www.googleapis.com/auth/admin.directory.user.readonly"],
    subject: adminEmail, // 도메인 전체 위임: 관리자 가장
  });
  const admin = google.admin({ version: "directory_v1", auth: jwt });
  const res = await admin.users.get({ userKey: email });
  return (res.data.id as string | undefined) ?? null;
}
