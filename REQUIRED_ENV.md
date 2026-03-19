# 필수 환경변수 체크리스트

현재 코드 기준으로 실제 사용되는 환경변수만 정리했습니다.

## 1) Google Sheets (필수)

- [ ] `GOOGLE_SHEETS_ID` 또는 `GOOGLE_SHEETS_URL`
- [ ] `GOOGLE_PROJECT_ID`
- [ ] `GOOGLE_CLIENT_EMAIL`
- [ ] `GOOGLE_PRIVATE_KEY`

예시:

```env
GOOGLE_SHEETS_ID=your_spreadsheet_id
GOOGLE_PROJECT_ID=your_google_project_id
GOOGLE_CLIENT_EMAIL=your-service-account@your_google_project_id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

주의:

- `GOOGLE_PRIVATE_KEY`는 한 줄로 입력하고 줄바꿈은 `\n` 형태로 넣기
- 서비스 계정 이메일을 대상 스프레드시트에 편집자로 공유해야 함

---

## 2) Firebase Storage (필수)

- [ ] `NEXT_PUBLIC_FIREBASE_API_KEY`
- [ ] `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- [ ] `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- [ ] `NEXT_PUBLIC_FIREBASE_APP_ID`

예시:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=youngsun-app
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## 3) Google Chat 알림 (필수)

- [ ] `GOOGLE_CHAT_WEBHOOK_URL`

예시:

```env
GOOGLE_CHAT_WEBHOOK_URL=https://chat.googleapis.com/v1/spaces/.../messages?key=...&token=...
```

---

## 4) 관리자 로그인 (필수)

- [ ] `ADMIN_PASSWORD`

예시:

```env
ADMIN_PASSWORD=your_admin_password
```

---

## 5) 선택 환경변수

- [ ] `GOOGLE_SHEETS_SHEET_NAME` (기본은 첫 번째 시트)
- [ ] `NEXT_PUBLIC_APP_URL` (알림 링크 도메인 고정 시)

---

## 빠른 점검 순서

1. `.env.local`에 위 필수값 입력
2. `npm run dev` 실행
3. `/request`에서 테스트 요청 제출
4. 확인 항목
   - 시트에 행이 추가되는지
   - 사진 업로드가 되는지
   - Google Chat 알림이 오는지

