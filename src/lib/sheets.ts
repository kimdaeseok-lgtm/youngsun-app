import { google } from "googleapis";
import type { SheetEntry } from "@/types/entry";

function quoteSheetNameIfNeeded(sheetName: string): string {
  const escaped = sheetName.replace(/'/g, "''");
  return `'${escaped}'`;
}

function extractSpreadsheetId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  if (!raw.includes("/") && raw.length >= 10) return raw;
  const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return m?.[1] ?? null;
}

function getSpreadsheetId(): string {
  const byId = (process.env.GOOGLE_SHEETS_ID ?? "").trim();
  if (byId) return byId;
  const byUrl = extractSpreadsheetId(process.env.GOOGLE_SHEETS_URL ?? "");
  if (byUrl) return byUrl;
  throw new Error("GOOGLE_SHEETS_ID (or GOOGLE_SHEETS_URL) is not set");
}

async function loadServiceAccountCredentials(): Promise<object> {
  const clientEmail = (process.env.GOOGLE_CLIENT_EMAIL ?? "").trim();
  const privateKeyRaw = (process.env.GOOGLE_PRIVATE_KEY ?? "").trim();

  if (!clientEmail) throw new Error("GOOGLE_CLIENT_EMAIL is not set");
  if (!privateKeyRaw) throw new Error("GOOGLE_PRIVATE_KEY is not set");

  const projectIdFromEmail =
    clientEmail.match(/@([^.]+(?:-[^.]+)*)\.iam\.gserviceaccount\.com$/)?.[1] ??
    "";
  const projectId =
    (process.env.GOOGLE_PROJECT_ID ?? "").trim() || projectIdFromEmail;
  if (!projectId) throw new Error("GOOGLE_PROJECT_ID is not set");

  const privateKey = privateKeyRaw
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n");

  return {
    type: "service_account",
    project_id: projectId,
    client_email: clientEmail,
    private_key: privateKey,
  };
}

async function getAuth() {
  const credentials = await loadServiceAccountCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheetName(
  spreadsheetId: string,
  auth: unknown
): Promise<string> {
  const envName = (process.env.GOOGLE_SHEETS_SHEET_NAME ?? "").trim();
  if (envName) return envName;

  const sheets = google.sheets({ version: "v4", auth: auth as never });
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(title))",
  });
  return meta.data.sheets?.[0]?.properties?.title?.trim() || "Sheet1";
}

/** A~J: 연번, 요청날짜, 요청자, 요청장소, 요청내용, 요청사항사진, 조치사항, 조치날짜, 비고, 사진보기 */
function rowToEntry(row: string[]): SheetEntry {
  return {
    id: row[0] ?? "",
    requestDate: row[1] ?? "",
    requester: row[2] ?? "",
    location: row[3] ?? "",
    details: row[4] ?? "",
    requestPhotoUrl: row[5] ?? "",
    actionTaken: row[6] ?? "",
    actionDate: row[7] ?? "",
    remarks: row[8] ?? "",
    photoView: row[9] ?? "",
  };
}

export async function getEntries(): Promise<SheetEntry[]> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(spreadsheetId, auth);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetNameIfNeeded(sheetName)}!A2:J`,
  });
  const rows = (res.data.values ?? []) as string[][];
  return rows
    .map((row) => rowToEntry(row))
    .filter((e) => {
      const r = (e.requester ?? "").trim();
      const l = (e.location ?? "").trim();
      const d = (e.details ?? "").trim();
      return Boolean(r || l || d);
    });
}

/** G열(조치사항)이 비어 있는 항목 */
export function getPendingEntries(entries: SheetEntry[]): SheetEntry[] {
  return entries.filter((e) => !(e.actionTaken ?? "").trim());
}

export async function findRowIndexById(id: string): Promise<number | null> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(spreadsheetId, auth);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${quoteSheetNameIfNeeded(sheetName)}!A2:A`,
  });
  const rows = res.data.values ?? [];
  const index = rows.findIndex((row) => (row[0] ?? "").trim() === id);
  if (index < 0) return null;
  return index + 2;
}

/**
 * G=조치사항, H=조치날짜, I=비고, J=사진보기(조치 후 사진 URL)
 */
export async function updateRowAction(
  rowIndex: number,
  actionContent: string,
  actionDate: string,
  remarks: string,
  actionPhotoUrl: string
): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(spreadsheetId, auth);
  const prefix = quoteSheetNameIfNeeded(sheetName);
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId,
    requestBody: {
      valueInputOption: "USER_ENTERED",
      data: [
        { range: `${prefix}!G${rowIndex}`, values: [[actionContent]] },
        { range: `${prefix}!H${rowIndex}`, values: [[actionDate]] },
        { range: `${prefix}!I${rowIndex}`, values: [[remarks]] },
        { range: `${prefix}!J${rowIndex}`, values: [[actionPhotoUrl]] },
      ],
    },
  });
}

export async function appendRequestRow(entry: {
  id: string;
  requestDate: string;
  requester: string;
  location: string;
  details: string;
  requestPhotoUrl: string;
}): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const sheetName = await getSheetName(spreadsheetId, auth);
  const photoView = entry.requestPhotoUrl || "";
  const row = [
    entry.id,
    entry.requestDate,
    entry.requester,
    entry.location,
    entry.details,
    entry.requestPhotoUrl,
    "",
    "",
    "",
    photoView,
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${quoteSheetNameIfNeeded(sheetName)}!A:J`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}
