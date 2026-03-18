import { getFirebaseAdminApp } from "@/lib/firebaseAdmin";

function parseAdminFcmTokens(): string[] {
  const raw = (process.env.ADMIN_FCM_TOKENS ?? "").trim();
  if (!raw) return [];
  return raw
    .split(/[\n,]+/g)
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export async function sendNewRequestPushNotification(params: {
  viewLink: string;
}): Promise<{
  attempted: boolean;
  tokensCount: number;
  successCount: number;
  failureCount: number;
  failureReasons: string[];
}> {
  const tokens = parseAdminFcmTokens();
  if (tokens.length === 0) {
    return {
      attempted: false,
      tokensCount: 0,
      successCount: 0,
      failureCount: 0,
      failureReasons: [],
    };
  }

  const app = await getFirebaseAdminApp();
  const messaging = app.messaging();

  const link = params.viewLink.replace(/\/$/, "") + "/admin";

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: {
      title: "영선 요청 등록",
      body: "새로운 영선 요청이 등록 되었습니다. 확인해 보세요",
    },
    webpush: {
      fcmOptions: { link },
      notification: {
        // 선택: 알림 표시를 위한 기본 아이콘
        icon: "/repair.png",
      },
    },
    data: {
      type: "NEW_REQUEST",
      link,
    },
  });

  // 전송 실패 토큰은 운영에서 정리할 수 있도록 로그로 남김
  if (res.failureCount > 0) {
    const failed: Array<{ token: string; error: string }> = [];
    res.responses.forEach((r, i) => {
      if (!r.success) {
        failed.push({
          token: tokens[i] ?? "",
          error: r.error?.message ?? "unknown",
        });
      }
    });
    console.warn("FCM multicast failures:", failed);
  }

  const failureReasons = res.responses
    .filter((r) => !r.success)
    .map((r) => r.error?.message ?? "unknown");

  return {
    attempted: true,
    tokensCount: tokens.length,
    successCount: res.successCount,
    failureCount: res.failureCount,
    failureReasons: Array.from(new Set(failureReasons)).slice(0, 5),
  };
}

