import { NextResponse } from "next/server";
import {
  ALLOWED_DOMAIN,
  OAUTH_STATE_COOKIE,
  getOrigin,
  randomToken,
  safeNextPath,
} from "@/lib/auth";

/** 구글 로그인 시작: 구글 동의화면으로 리다이렉트 */
export async function GET(request: Request) {
  const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID ?? "").trim();
  if (!clientId) {
    return NextResponse.json(
      { error: "GOOGLE_OAUTH_CLIENT_ID 가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  const origin = getOrigin(request);
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const nonce = randomToken();
  // state = nonce|next (쿠키의 nonce와 대조해 CSRF 방지)
  const state =
    nonce + "|" + Buffer.from(next, "utf8").toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${origin}/api/auth/callback`,
    response_type: "code",
    scope: "openid email profile",
    hd: ALLOWED_DOMAIN, // 도메인 힌트(강제는 콜백에서 재검증)
    prompt: "select_account",
    state,
  });

  const res = NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
  res.cookies.set(OAUTH_STATE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // 10분
  });
  return res;
}
