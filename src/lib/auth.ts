/**
 * 구글 로그인 세션 (외부 의존성 없음)
 * - 세션 쿠키를 HMAC-SHA256으로 서명/검증 (Edge 미들웨어·Node 라우트 모두 동작: Web Crypto 사용)
 * - shimteo.org 도메인 계정만 허용
 */
export const SESSION_COOKIE = "ys_session";
export const OAUTH_STATE_COOKIE = "ys_oauth_state";
export const SESSION_TTL_SEC = 60 * 60 * 24 * 7; // 7일
/** 허용 도메인 (환경변수로 덮어쓸 수 있음, 기본 shimteo.org) */
export const ALLOWED_DOMAIN =
  (process.env.ALLOWED_EMAIL_DOMAIN ?? "shimteo.org").trim() || "shimteo.org";

export type Session = { email: string; name?: string };

const encoder = new TextEncoder();

function bytesToB64url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** 세션 토큰 생성: base64url(payload).base64url(hmac) */
export async function createSessionToken(
  session: Session,
  secret: string,
  ttlSec: number = SESSION_TTL_SEC
): Promise<string> {
  const payload = JSON.stringify({
    e: session.email,
    n: session.name ?? "",
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  });
  const payloadB64 = bytesToB64url(encoder.encode(payload));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64))
  );
  return `${payloadB64}.${bytesToB64url(sig)}`;
}

/** 세션 토큰 검증 → 유효하면 세션, 아니면 null */
export async function verifySessionToken(
  token: string | undefined,
  secret: string
): Promise<Session | null> {
  if (!token || !secret || token.indexOf(".") < 0) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;
  try {
    const key = await hmacKey(secret);
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      b64urlToBytes(sigB64),
      encoder.encode(payloadB64)
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(payloadB64))
    );
    if (!payload || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    if (!payload.e) return null;
    return { email: String(payload.e), name: payload.n ? String(payload.n) : "" };
  } catch {
    return null;
  }
}

/** 랜덤 문자열(state/CSRF) */
export function randomToken(len = 24): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return bytesToB64url(arr);
}

/** 구글 id_token(JWT) payload 디코드 — 토큰 엔드포인트에서 직접 받은 값이라 서명 재검증 생략 */
export function decodeIdToken(idToken: string): Record<string, unknown> | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(parts[1])));
  } catch {
    return null;
  }
}

/** 요청 헤더로 실제 접속 origin 계산 (Vercel: x-forwarded-*) */
export function getOrigin(req: Request): string {
  const h = req.headers;
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${proto}://${host}`;
  try {
    return new URL(req.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}

/** 로그인 후 돌아갈 경로 검증(오픈 리다이렉트 방지: 내부 경로만) */
export function safeNextPath(next: string | null | undefined): string {
  const n = (next ?? "").trim();
  if (n.startsWith("/") && !n.startsWith("//")) return n;
  return "/";
}
