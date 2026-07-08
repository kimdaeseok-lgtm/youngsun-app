import { ALLOWED_DOMAIN, safeNextPath } from "@/lib/auth";

export const metadata = { title: "로그인 | 영선일지" };

const ERROR_MESSAGES: Record<string, string> = {
  domain: `${process.env.ALLOWED_EMAIL_DOMAIN ?? "shimteo.org"} 계정으로만 로그인할 수 있습니다. 조직 구글 계정으로 다시 시도해 주세요.`,
  state: "로그인 세션이 만료되었습니다. 다시 시도해 주세요.",
  token: "구글 인증에 실패했습니다. 잠시 후 다시 시도해 주세요.",
  config: "로그인 설정이 완료되지 않았습니다. 관리자에게 문의해 주세요.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = safeNextPath(sp.next);
  const error = sp.error ? ERROR_MESSAGES[sp.error] ?? "로그인에 실패했습니다." : "";
  const loginHref = `/api/auth/google?next=${encodeURIComponent(next)}`;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-white px-4">
      <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">영선일지</h1>
        <p className="text-center text-sm text-zinc-500">
          {ALLOWED_DOMAIN} 구글 계정으로 로그인해 주세요.
        </p>
        {error && (
          <p
            className="w-full rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        <a
          href={loginHref}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white font-semibold text-zinc-800 hover:bg-zinc-50"
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.8-6.8C35.6 2.4 30.1 0 24 0 14.6 0 6.4 5.4 2.6 13.2l7.9 6.2C12.3 13.5 17.6 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.1 24.6c0-1.6-.1-3.1-.4-4.6H24v9.1h12.4c-.5 2.9-2.1 5.4-4.6 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.5z" />
            <path fill="#FBBC05" d="M10.5 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.2C1 16.5 0 20.1 0 24s1 7.5 2.6 10.8l7.9-6.2z" />
            <path fill="#34A853" d="M24 48c6.1 0 11.3-2 15-5.5l-7.1-5.5c-2 1.3-4.6 2.1-7.9 2.1-6.4 0-11.7-4-13.5-9.9l-7.9 6.2C6.4 42.6 14.6 48 24 48z" />
          </svg>
          구글 계정으로 로그인
        </a>
      </div>
    </main>
  );
}
