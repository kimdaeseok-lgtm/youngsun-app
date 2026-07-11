import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/**
 * 전체 페이지·API 보호 (로그인·정적 파일 제외). 세션 없으면:
 *  - /api/* → 401 JSON
 *  - 그 외 → /login 으로 이동(로그인 후 원래 경로 복귀)
 */
export async function middleware(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? "";
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, secret);
  if (session) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname + search);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // 로그인 페이지·인증 API·정적 리소스는 미들웨어 제외
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico|repair.png|shimteo-ci.png|intranet|robots.txt|sitemap.xml).*)",
  ],
};
