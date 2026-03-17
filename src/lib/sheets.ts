import { google } from "googleapis";
import type { SheetEntry } from "@/types/entry";
import { promises as fs } from "node:fs";
import path from "node:path";

function hasSheetPrefix(range: string): boolean {
  return range.includes("!");
}

function quoteSheetNameIfNeeded(sheetName: string): string {
  // Always quote to safely handle spaces/special chars.
  const escaped = sheetName.replace(/'/g, "''");
  return `'${escaped}'`;
}

function extractSpreadsheetId(input: string): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;
  // If already looks like an ID (no slashes), accept it.
  if (!raw.includes("/") && raw.length >= 10) return raw;
  // Typical URL: https://docs.google.com/spreadsheets/d/{ID}/edit...
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
  const rawEnv = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (rawEnv) {
    try {
      return JSON.parse(rawEnv) as object;
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is invalid JSON");
    }
  }

  const keyPath =
    (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH ?? "").trim() ||
    path.join(process.cwd(), "youngsun-app-key.json");

  try {
    const file = await fs.readFile(keyPath, "utf8");
    return JSON.parse(file) as object;
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "Failed to read service account key";
    throw new Error(
      `Service account key not found/readable. Tried: ${keyPath}. ${msg}`
    );
  }
}

async function getAuth() {
  const credentials = await loadServiceAccountCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function getSheetName(spreadsheetId: string, auth: unknown): Promise<string> {
  const envName = (process.env.GOOGLE_SHEETS_SHEET_NAME ?? "").trim();
  if (envName) return envName;

  const sheets = google.sheets({ version: "v4", auth: auth as never });
  const meta = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(title))",
  });
  const title =
    meta.data.sheets?.[0]?.properties?.title?.trim() ||
    "Sheet1";
  return title;
}

async function normalizeRange(
  spreadsheetId: string,
  auth: unknown,
  range: string
): Promise<string> {
  const raw = range.trim();
  if (hasSheetPrefix(raw)) return raw;
  const sheetName = await getSheetName(spreadsheetId, auth);
  return `${quoteSheetNameIfNeeded(sheetName)}!${raw}`;
}

function rowToEntry(row: string[]): SheetEntry {
  return {
    id: row[0] ?? "",
    requestDate: row[1] ?? "",
    requester: row[2] ?? "",
    location: row[3] ?? "",
    details: row[4] ?? "",
    requestPhotoUrl: row[5] ?? "",
    actionTaken: row[6] ?? "",
    actionPhotoUrl: row[7] ?? "",
    actionDate: row[8] ?? "",
  };
}

/**
 * 시트 전체 목록 조회 (2행부터, 헤더 제외)
 */
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
  return rows.map((row) => rowToEntry(row));
}

/** G열(조치사항)이 비어 있는 항목만 */
export function getPendingEntries(entries: SheetEntry[]): SheetEntry[] {
  return entries.filter((e) => !(e.actionTaken ?? "").trim());
}

/**
 * 연번(id)으로 시트 행 번호 찾기 (1-based)
 */
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
 * 해당 행의 G(조치내용), H(조치후사진), I(조치날짜) 업데이트
 */
export async function updateRowAction(
  rowIndex: number,
  actionContent: string,
  actionPhotoUrl: string,
  actionDate: string
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
        { range: `${prefix}!H${rowIndex}`, values: [[actionPhotoUrl]] },
        { range: `${prefix}!I${rowIndex}`, values: [[actionDate]] },
      ],
    },
  });
}

/**
 * 시트 행: A=연번, B=요청날짜, C=요청자, D=요청장소, E=요청내용, F=요청사항사진, G=조치사항, H=조치사항사진, I=조치날짜, J=사진보기
 */
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
  const row = [
    entry.id,
    entry.requestDate,
    entry.requester,
    entry.location,
    entry.details,
    entry.requestPhotoUrl,
    "", // G 조치사항
    "", // H 조치사항사진
    "", // I 조치날짜
    "", // J 사진보기
  ];
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${quoteSheetNameIfNeeded(sheetName)}!A:J`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [row] },
  });
}

/**
 * 기본 읽기 함수: A1 표기 range를 그대로 받습니다.
 * 예) readValues(\"Sheet1!A2:J\")
 */
export async function readValues(range: string): Promise<string[][]> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const normalized = await normalizeRange(spreadsheetId, auth, range);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: normalized,
  });
  return (res.data.values ?? []) as string[][];
}

/**
 * 기본 쓰기 함수(덮어쓰기): 범위에 values를 씁니다.
 * 예) writeValues(\"Sheet1!G10:I10\", [[\"조치\", \"url\", \"2026-03-17\"]])
 */
export async function writeValues(
  range: string,
  values: (string | number | boolean | null)[][]
): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const normalized = await normalizeRange(spreadsheetId, auth, range);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: normalized,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

/**
 * 기본 추가 함수(append): range 기준으로 뒤에 행이 추가됩니다.
 * 예) appendValues(\"Sheet1!A:J\", [[...row]])
 */
export async function appendValues(
  range: string,
  values: (string | number | boolean | null)[][]
): Promise<void> {
  const spreadsheetId = getSpreadsheetId();
  const auth = await getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const normalized = await normalizeRange(spreadsheetId, auth, range);
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: normalized,
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}
