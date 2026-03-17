import nodemailer from "nodemailer";

function getAdminEmails(): string[] {
  const emails: string[] = [];
  for (let i = 1; i <= 3; i++) {
    const e = process.env[`ADMIN_${i}_EMAIL`]?.trim();
    if (e) emails.push(e);
  }
  return emails;
}

function getTransporter() {
  const host = process.env.SMTP_HOST ?? "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) throw new Error("SMTP_USER and SMTP_PASS are required for email.");
  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

/**
 * 새 영선 요청 접수 시 담당자 3명 이메일로 알림 발송
 */
export async function sendNewRequestNotification(
  requester: string,
  location: string,
  details: string,
  photoUrl: string,
  viewLink: string
): Promise<void> {
  const toList = getAdminEmails();
  if (toList.length === 0) return;

  const transporter = getTransporter();
  const photoLink = photoUrl ? `사진 확인: ${photoUrl}` : "(사진 없음)";

  const html = `
    <p>새로운 영선 요청이 접수되었습니다.</p>
    <ul>
      <li><strong>요청자:</strong> ${escapeHtml(requester || "-")}</li>
      <li><strong>장소:</strong> ${escapeHtml(location || "-")}</li>
      <li><strong>내용:</strong> ${escapeHtml(details || "-")}</li>
      <li><strong>사진:</strong> ${photoUrl ? `<a href="${escapeHtml(photoUrl)}">사진 보기</a>` : "-"}</li>
    </ul>
    <p>요청 내용 및 사진 확인: <a href="${escapeHtml(viewLink)}">${escapeHtml(viewLink)}</a></p>
  `;

  const text = [
    "새로운 영선 요청이 접수되었습니다.",
    "",
    `요청자: ${requester || "-"}`,
    `장소: ${location || "-"}`,
    `내용: ${details || "-"}`,
    photoLink,
    "",
    `요청 내용 및 사진 확인: ${viewLink}`,
  ].join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to: toList.join(", "),
    subject: "새로운 영선 요청이 접수되었습니다",
    text,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
