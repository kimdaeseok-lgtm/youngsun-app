import { NextResponse } from "next/server";
import { appendValues } from "@/lib/sheets";
import { getFirebaseAdminBucket } from "@/lib/firebaseAdmin";

function publicUrlFor(bucketName: string, objectPath: string) {
  const encoded = objectPath.split("/").map(encodeURIComponent).join("/");
  return `https://storage.googleapis.com/${bucketName}/${encoded}`;
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "form-data의 file 필드에 이미지 파일을 넣어주세요." },
        { status: 400 }
      );
    }

    const contentType = file.type || "application/octet-stream";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { ok: false, error: "이미지 파일만 업로드할 수 있습니다." },
        { status: 400 }
      );
    }

    const uploadedAt = new Date().toISOString();
    const extFromName = file.name.split(".").pop();
    const ext =
      (extFromName && extFromName.length <= 8 ? extFromName : "") ||
      (contentType.split("/")[1] ?? "jpg");

    const objectPath = `youngsun/api-uploads/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const bucket = await getFirebaseAdminBucket();
    const buffer = Buffer.from(await file.arrayBuffer());

    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(buffer, {
      resumable: false,
      contentType,
      metadata: {
        cacheControl: "public, max-age=31536000",
      },
    });

    // public URL 생성용으로 공개 설정
    await gcsFile.makePublic();

    const url = publicUrlFor(bucket.name, objectPath);

    // 시트 마지막 행에 (URL, 업로드시간) 한 줄 기록
    // 기본: 첫 번째 시트 탭의 A:B 컬럼에 append
    await appendValues("A:B", [[url, uploadedAt]]);

    return NextResponse.json({ ok: true, url, uploadedAt });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "업로드/기록 처리에 실패했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

