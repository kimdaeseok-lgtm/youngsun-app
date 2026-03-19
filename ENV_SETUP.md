# 영선일지 앱 환경 변수 설정 가이드

## 1) `.env.local` 만들기

- 프로젝트 루트에서 `.env.local.example`을 복사해 `.env.local` 생성
- Windows:
  - `Copy-Item .env.local.example .env.local`

---

## 2) Google Sheets 설정 (필수)

- Google Cloud Console에서 **Google Sheets API / Google Drive API** 사용 설정
- 서비스 계정 생성
- 대상 스프레드시트에 서비스 계정 이메일을 편집자로 공유
- `.env.local`에 아래 값 입력
  - `GOOGLE_SHEETS_ID` (또는 `GOOGLE_SHEETS_URL`)
  - `GOOGLE_PROJECT_ID`
  - `GOOGLE_CLIENT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`

> 현재 코드는 **서비스 계정 JSON 파일을 읽지 않습니다.**
> (`youngsun-app-key.json` 같은 파일 기반 방식 미사용)

---

## 3) Firebase Storage 설정 (필수)

- Firebase Console에서 프로젝트 생성 후 Storage 활성화
- 웹 앱 firebaseConfig 값을 `.env.local`의 `NEXT_PUBLIC_FIREBASE_*` 항목에 입력

---

## 4) Google Chat 웹훅 알림 설정 (필수)

- Google Chat 스페이스에서 Incoming Webhook 생성
- `.env.local`에 `GOOGLE_CHAT_WEBHOOK_URL` 입력

---

## 5) 관리자 로그인 설정 (필수)

- `.env.local`에 `ADMIN_PASSWORD` 설정

---

## 6) 실행 확인

- `.env.local`은 Git에 커밋하지 않기
- `npm run dev` 실행
- 요청 화면: `http://localhost:3000/request`
