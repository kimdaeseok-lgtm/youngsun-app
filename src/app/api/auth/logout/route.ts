import { NextResponse } from "next/server";
import { SESSION_COOKIE, getOrigin } from "@/lib/auth";

/** 로그아웃: 세션 쿠키 삭제 후 로그인 페이지로 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

export async function GET(request: Request) {
  const origin = getOrigin(request);
  const res = NextResponse.redirect(new URL("/login", origin));
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
