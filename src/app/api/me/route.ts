import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

/** 현재 로그인한 사용자 정보(요청자 자동 입력용) */
export async function GET() {
  const secret = process.env.AUTH_SECRET ?? "";
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token, secret);
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ email: session.email, name: session.name ?? "" });
}
