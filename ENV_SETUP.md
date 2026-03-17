# 영선일지 앱 환경 변수 설정 가이드

## 1. .env.local 만들기

프로젝트 루트에 `.env.local` 파일을 만들고 아래 항목을 채웁니다.

- `.env.local.example` 을 복사해 `.env.local` 로 저장
- Windows: `Copy-Item .env.local.example .env.local`

---

## 2. Google Sheets API

- Google Cloud Console에서 Google Sheets API, Google Drive API 사용 설정
- 서비스 계정 생성 후 JSON 키 다운로드
- 영선일지 시트에 서비스 계정 이메일을 편집자로 공유
- `.env.local` 에 `GOOGLE_SHEETS_ID`(또는 `GOOGLE_SHEETS_URL`) 설정
- 서비스 계정 키는 프로젝트 루트의 `youngsun-app-key.json` 파일을 기본으로 사용합니다. (이미 `.gitignore`에 포함되어 있어 커밋되지 않습니다.)

---

## 3. Firebase

- Firebase Console에서 프로젝트 생성, Storage 사용 설정
- 웹 앱 추가 후 나오는 firebaseConfig 값을 `.env.local` 의 `NEXT_PUBLIC_FIREBASE_*` 항목에 넣기

---

## 4. 담당자 이메일 (3명)

- `ADMIN_1_EMAIL`, `ADMIN_2_EMAIL`, `ADMIN_3_EMAIL` 에 각 담당자 이메일 입력
- 예: admin1@test.com, admin2@test.com, admin3@test.com

---

## 5. 메일 알림 (Nodemailer)

요청 제출 시 담당자 3명 이메일로 알림이 발송됩니다.

- Outlook(Office 365) 사용 시: `SMTP_HOST=smtp.office365.com`, `SMTP_PORT=587`, `SMTP_SECURE=false`
- .env.local 에 SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS 설정
- SMTP_USER: 보내는 계정 이메일, SMTP_PASS: 비밀번호(조직 정책에 따라 앱 비밀번호/SMTP AUTH 허용이 필요할 수 있음)

---

## 6. 확인

- .env.local 은 Git에 올리지 마세요.
- 설정 후 npm run dev 로 실행해 동작을 확인하세요.
- 요청 접수 페이지: http://localhost:3000/request
