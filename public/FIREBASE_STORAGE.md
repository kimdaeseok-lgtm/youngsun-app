# Firebase Storage (사진 업로드)

업로드가 **오래 걸리다 타임아웃**되거나 **거부**되면 아래를 확인하세요.

## 1. 환경 변수

`.env.local`의 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 은 **버킷 이름만** 넣습니다.

- 올바른 예: `내프로젝트ID.appspot.com` 또는 콘솔에 표시된 `*.firebasestorage.app` 형식
- `gs://` 는 있어도 되고 없어도 됩니다 (코드에서 정리함)

## 2. Storage 보안 규칙 (예시)

콘솔 → **Storage** → **Rules** 에서 `youngsun/` 아래만 허용하는 예:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /youngsun/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
        && request.resource.size < 5 * 1024 * 1024;
    }
  }
}
```

`request.auth != null` 을 쓰면 **Authentication → Sign-in method → 익명(Anonymous)** 을 켜 두는 것이 좋습니다.  
(앱이 업로드 전에 익명 로그인을 시도합니다. 익명을 끄면 규칙을 `allow write: if true` 로 테스트할 수 있으나 운영에는 비권장입니다.)

## 3. 테스트용 (개발만, 짧게)

```
match /youngsun/{allPaths=**} {
  allow read, write: if true;
}
```

테스트 후 반드시 위처럼 제한하세요.
