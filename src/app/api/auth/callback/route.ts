import { NextResponse } from "next/server";
import {
  ALLOWED_DOMAIN,
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  SESSION_TTL_SEC,
  createSessionToken,
  decodeIdToken,
  getOrigin,
  safeNextPath,
} from "@/lib/auth";

function loginError(origin: string, code: string) {
  const u = new URL("/login", origin);
  u.searchParams.set("error", code);
  return NextResponse.redirect(u);
}

/** 구글 로그인 콜백: code 교환 → 도메인 검증 → 세션 쿠키 발급 */
export async function GET(request: Request) {
  const origin = getOrigin(request);
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";

  const clientId = (process.env.GOOGLE_OAUTH_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "").trim();
  const authSecret = (process.env.AUTH_SECRET ?? "").trim();
  if (!clientId || !clientSecret || !authSecret) {
    return loginError(origin, "config");
  }

  // state(nonce|next) 검증
  const [nonce, nextB64] = state.split("|");
  const cookieNonce = request.headers
    .get("cookie")
    ?.match(new RegExp(`(?:^|; )${OAUTH_STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !nonce || !cookieNonce || nonce !== cookieNonce) {
    return loginError(origin, "state");
  }
  let next = "/";
  try {
    next = safeNextPath(Buffer.from(nextB64 ?? "", "base64url").toString("utf8"));
  } catch {
    next = "/";
  }

  // 토큰 교환
  let idToken = "";
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${origin}/api/auth/callback`,
        grant_type: "authorization_code",
      }),
      cache: "no-store",
    });
    const tok = await tokenRes.json();
    if (!tokenRes.ok || !tok.id_token) return loginError(origin, "token");
    idToken = tok.id_token as string;
  } catch {
    return loginError(origin, "token");
  }

  // 도메인·이메일 검증
  const claims = decodeIdToken(idToken);
  const email = String((claims?.email as string) ?? "").toLowerCase();
  const emailVerified =
    claims?.email_verified === true || claims?.email_verified === "true";
  const domain = email.split("@")[1] ?? "";
  if (!email || !emailVerified || domain !== ALLOWED_DOMAIN) {
    return loginError(origin, "domain");
  }

  const name = String((claims?.name as string) ?? "");
  const sessionToken = await createSessionToken({ email, name }, authSecret);

  const res = NextResponse.redirect(new URL(next, origin));
  res.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SEC,
  });
  res.cookies.set(OAUTH_STATE_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
