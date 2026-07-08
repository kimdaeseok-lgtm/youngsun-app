# 영선일지 — 구글 로그인 설정 (shimteo.org 전용)

앱 전체가 **shimteo.org 구글 계정 로그인**으로 보호됩니다. 아래 설정을 마치면 동작합니다.

## 1. 구글 OAuth 클라이언트 만들기 (1회)

1. https://console.cloud.google.com → 상단 프로젝트 선택(기존 Firebase/시트용 프로젝트를 써도 됩니다).
2. **API 및 서비스 → OAuth 동의 화면**
   - User Type: **내부(Internal)** 선택. (shimteo.org 는 구글 워크스페이스 도메인이므로 내부가 표시됨 → shimteo.org 조직 계정만 로그인 가능, 외부 계정은 시도 자체 차단.)
   - 앱 이름·지원 이메일 입력 후 저장.
3. **API 및 서비스 → 사용자 인증 정보 → 사용자 인증 정보 만들기 → OAuth 클라이언트 ID**
   - 유형: **웹 애플리케이션**
   - **승인된 리디렉션 URI**에 아래 2개 추가:
     - `https://youngsun-app.vercel.app/api/auth/callback` (실제 배포 주소)
     - `http://localhost:3000/api/auth/callback` (로컬 테스트용)
   - 만들면 **클라이언트 ID**와 **클라이언트 보안 비밀**이 나옵니다.

> 리디렉션 URI는 실제 접속 주소마다 정확히 등록되어 있어야 합니다. Vercel 프리뷰(임의 서브도메인)에서도 쓰려면 그 주소도 추가하거나, 고정 도메인에서 테스트하세요.

## 2. Vercel 환경변수 등록

Vercel 프로젝트 → **Settings → Environment Variables** 에 추가(Production·Preview 모두):

| 이름 | 값 |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | 1단계의 클라이언트 ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | 1단계의 클라이언트 보안 비밀 |
| `AUTH_SECRET` | 무작위 긴 문자열 (예: 터미널에서 `openssl rand -base64 32`) |
| `ALLOWED_EMAIL_DOMAIN` | (선택) 기본 `shimteo.org`. 바꿀 일 없으면 생략 |

등록 후 **재배포(Redeploy)** 해야 반영됩니다.

## 3. 동작 방식

- 로그인 안 한 상태로 어떤 페이지든 열면 → `/login` 으로 이동 → "구글 계정으로 로그인" 클릭.
- 구글 로그인 후 **이메일 도메인이 shimteo.org 인지 서버에서 재검증** → 통과해야 세션 쿠키 발급(7일 유지).
- 다른 도메인 계정으로 로그인하면 "shimteo.org 계정만 가능" 안내로 막힙니다.
- 우측/하단의 **로그아웃** 링크로 세션 종료(`/api/auth/logout`).

## 4. 로컬 테스트

`.env.local` 에 같은 변수(+`NEXT_PUBLIC_APP_URL=http://localhost:3000`)를 넣고 `npm run dev` → http://localhost:3000 접속.

## 참고 — 이번에 함께 정리된 것
- 작동하지 않던 **비밀번호 로그인**(admin/login 페이지·API·admin_session 쿠키) 제거.
- 미사용 함수 `getPendingEntries` 제거.
- 옛 **팀즈 알림(MS_TEAMS_WEBHOOK_URL)** 은 미사용 — 환경변수에서 지워도 됩니다(알림은 구글챗 `GOOGLE_CHAT_WEBHOOK_URL` 사용).
</content>
