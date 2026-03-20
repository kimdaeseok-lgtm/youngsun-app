# 앱 아이콘 (public 폴더)

현재 앱 아이콘·메인 하단 이미지는 **`repair.png`** 를 씁니다. (`src/app/layout.tsx`의 `metadata.icons`, `src/app/page.tsx`의 `<Image />`)

## 기본 파일

| 파일명 | 용도 |
|--------|------|
| **repair.png** | 브라우저 탭·iOS 홈 화면용 메타 아이콘, 메인 페이지 하단 표시 |

바꾸려면 `public/repair.png` 를 덮어쓰거나, 다른 이름을 쓸 경우 `layout.tsx`·`page.tsx`의 경로를 같이 수정하세요.

## 그 외 (선택)

| 파일명 | 용도 | 권장 크기 |
|--------|------|-----------|
| **favicon.ico** | 구형 브라우저가 `/favicon.ico` 를 직접 요청할 때 | 32×32 ICO |
| **icon-192.png**, **icon-512.png** | PWA 등 | 정사각형 PNG |

## 참고

- `public` 안 파일은 사이트 **루트 URL**로 제공됩니다. (`public/favicon.ico` → `https://도메인/favicon.ico`)
- 캐시 때문에 교체 후에도 탭 아이콘이 안 바뀌면 강력 새로고침(Ctrl+Shift+R) 또는 시크릿 창으로 확인하세요.
