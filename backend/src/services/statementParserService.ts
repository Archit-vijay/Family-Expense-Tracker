import * as XLSX from "xlsx";

export interface RawParsedTransaction {
  date: string; // YYYY-MM-DD
  rawDescription: string;
  cleanTitle: string;
  amount: number;
  type: "income" | "expense";
  balance?: number;
  referenceNumber?: string;
  rawCategory?: string;
  rawRowIndex: number;
}

export interface ParseResult {
  success: boolean;
  requiresPassword?: boolean;
  invalidPassword?: boolean;
  error?: string;
  fileType: "csv" | "excel" | "pdf" | "unknown";
  fileName: string;
  transactions: RawParsedTransaction[];
}

export class StatementPasswordError extends Error {
  invalidPassword: boolean;

  constructor(invalidPassword = false, message?: string) {
    super(
      message ||
        (invalidPassword
          ? "Incorrect password. Please verify and try again."
          : "This statement is password-protected."),
    );
    this.name = "StatementPasswordError";
    this.invalidPassword = invalidPassword;
  }
}

/**
 * Clean complex bank narrations into crisp merchant / payee titles
 */
export function cleanNarrationToTitle(raw: string): string {
  if (!raw || !raw.trim()) return "Bank Transaction";

  let clean = raw.trim();

  // 1. UPI payment formats: e.g. "UPI/CR/428912/SWIGGY/HDFC/..." or "UPI/DR/123456/Zomato/..." or "UPI-SWIGGY-12345"
  const upiMatch = clean.match(/UPI(?:\/(?:CR|DR))?\/[A-Z0-9_-]+\/([^\/]+)/i);
  if (upiMatch && upiMatch[1]) {
    clean = upiMatch[1];
  } else {
    const upiAltMatch = clean.match(/UPI\/([^\/]+)/i);
    if (upiAltMatch && upiAltMatch[1]) {
      clean = upiAltMatch[1];
    }
  }

  // 2. POS Card swipes: e.g. "POS 40123456 STARBUCKS BANGALORE IN"
  const posMatch = clean.match(/POS(?:\s+\d+)?\s+([A-Za-z0-9\s&'-]+?)(?:\s+(?:BANGALORE|MUMBAI|DELHI|PUNE|HYDERABAD|CHENNAI|KOLKATA|IN|IND))?$/i);
  if (posMatch && posMatch[1]) {
    clean = posMatch[1];
  }

  // 3. NEFT / IMPS / RTGS transfers: e.g. "NEFT-AXN12345-RELIANCE JIO-" or "IMPS-4289-NETFLIX INDIA"
  const neftMatch = clean.match(/(?:NEFT|IMPS|RTGS)[-\s]+[A-Za-z0-9]+[-\s]+([A-Za-z0-9\s&'-]+?)(?:-[A-Za-z0-9]+)?$/i);
  if (neftMatch && neftMatch[1]) {
    clean = neftMatch[1];
  }

  // 4. Strip common VPA handles like "@okhdfcbank", "@paytm", "@upi", "@icici", etc.
  clean = clean.replace(/@[a-zA-Z0-9._-]+/g, "");

  // 5. Strip common bank prefixes and noise tokens
  clean = clean.replace(/^(?:INB|ACH|BILLDESK|PAYU|CC|E-COM|PAYTM|EPAY|BBPS|NACH)[-\s/]+/i, "");
  clean = clean.replace(/^(?:BY TRANSFER|TO TRANSFER|TRANSFER FROM|TRANSFER TO)[-\s:]+/i, "");
  clean = clean.replace(/(?:REF|TXN|UTR|CHQ|NO)[-:\s]*\d+/gi, "");

  // 6. Clean up trailing dashes, slashes, numbers, extra spaces
  clean = clean.replace(/[-_/\\:,*#]+/g, " ");
  clean = clean.replace(/\s+/g, " ").trim();

  // Capitalize properly if all uppercase
  if (clean === clean.toUpperCase() && clean.length > 2) {
    clean = clean
      .toLowerCase()
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  return clean.length >= 2 ? clean.slice(0, 100) : raw.slice(0, 100);
}

/**
 * Normalize dates from strings, numbers, or Date objects into YYYY-MM-DD
 */
export function normalizeDate(val: any): string | null {
  if (!val) return null;

  // Excel serial date number (e.g. 45210)
  if (typeof val === "number" && val > 30000 && val < 60000) {
    const excelEpoch = new Date(1899, 11, 30);
    const date = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 10);
    }
  }

  const str = String(val).trim();

  // Try standard ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    let year = dmyMatch[3];
    if (year.length === 2) {
      year = "20" + year;
    }
    return `${year}-${month}-${day}`;
  }

  // DD-Mon-YYYY (e.g. 24-Oct-2026 or 24 Oct 2026)
  const monthNames: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
    jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12",
  };
  const monMatch = str.match(/^(\d{1,2})[\/\s-]([a-zA-Z]{3})[\/\s-](\d{2,4})$/);
  if (monMatch) {
    const day = monMatch[1].padStart(2, "0");
    const month = monthNames[monMatch[2].toLowerCase()];
    let year = monMatch[3];
    if (year.length === 2) {
      year = "20" + year;
    }
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // General Date parse fallback
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000 && parsed.getFullYear() < 2100) {
    return parsed.toISOString().slice(0, 10);
  }

  return null;
}

/**
 * Clean currency and comma formatted string to positive number
 */
export function parseAmount(val: any): number | null {
  if (val === null || val === undefined || val === "") return null;
  if (typeof val === "number") return Math.abs(val);

  const clean = String(val)
    .replace(/[₹$,\s€£]/g, "")
    .replace(/[^\d.-]/g, "");

  const num = parseFloat(clean);
  if (isNaN(num)) return null;
  return Math.abs(num);
}

/**
 * Parse an Excel (.xlsx / .xls) buffer with optional password
 */
export async function parseExcelBuffer(
  buffer: Buffer,
  password?: string,
): Promise<RawParsedTransaction[]> {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      password: password || undefined,
      cellDates: true,
    });
  } catch (err: any) {
    const msg = (err?.message || "").toLowerCase();
    if (
      msg.includes("password") ||
      msg.includes("encrypted") ||
      msg.includes("protect")
    ) {
      throw new StatementPasswordError(!!password);
    }
    throw new Error(`Failed to read spreadsheet: ${err?.message || err}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  return parseTableRows(rows);
}

/**
 * Parse a CSV buffer
 */
export function parseCsvBuffer(buffer: Buffer): RawParsedTransaction[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, {
      type: "buffer",
      cellDates: true,
    });
  } catch (err: any) {
    throw new Error(`Failed to parse CSV file: ${err?.message || err}`);
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: "",
  });

  return parseTableRows(rows);
}

/**
 * Detect headers and parse tabular 2D array of rows (for CSV and Excel)
 */
export function parseTableRows(rows: any[][]): RawParsedTransaction[] {
  if (!rows || rows.length < 2) return [];

  // Find header row index
  let headerIndex = -1;
  let dateCol = -1;
  let descCol = -1;
  let debitCol = -1;
  let creditCol = -1;
  let amountCol = -1;
  let typeCol = -1;
  let catCol = -1;
  let refCol = -1;

  for (let r = 0; r < Math.min(rows.length, 25); r++) {
    const row = rows[r].map((c) => String(c).toLowerCase().trim());

    const dIdx = row.findIndex((c) =>
      /^(?:date|txn\s*date|transaction\s*date|value\s*date|posting\s*date)\b/i.test(c),
    );
    const descIdx = row.findIndex((c) =>
      /^(?:narration|description|particulars|details|remarks|transaction\s*details|merchant|payee|title|name)\b/i.test(c),
    );
    const drIdx = row.findIndex((c) =>
      !/created/i.test(c) && (
        /^(?:debit(?:\s*amount)?|withdrawal(?:\s*amount)?|dr\b|spent|expense)$/i.test(c) ||
        /^(?:debit|withdrawal)\b/i.test(c)
      ),
    );
    const crIdx = row.findIndex((c) =>
      !/created/i.test(c) && (
        /^(?:credit(?:\s*amount)?|deposit(?:\s*amount)?|cr\b|deposit|income)$/i.test(c) ||
        /^(?:credit|deposit)\b/i.test(c)
      ),
    );
    const amtIdx = row.findIndex((c) =>
      /^(?:amount|txn\s*amount|transaction\s*amount|total)\b/i.test(c),
    );

    if (dIdx !== -1 && (descIdx !== -1 || drIdx !== -1 || crIdx !== -1 || amtIdx !== -1)) {
      headerIndex = r;
      dateCol = dIdx;
      descCol = descIdx;
      debitCol = drIdx;
      creditCol = crIdx;
      amountCol = amtIdx;
      typeCol = row.findIndex((c) => /^(?:type|cr\/dr|dr\/cr|txn\s*type|transaction\s*type)$/i.test(c));
      catCol = row.findIndex((c) => /^(?:category|cat\b)$/i.test(c));
      refCol = row.findIndex((c) => /^(?:chq|ref|cheque|reference|utr|txn\s*id|transaction\s*id)\b/i.test(c));
      break;
    }
  }

  // Fallback: If no explicit header matched, check if first row looks like data
  const startRow = headerIndex !== -1 ? headerIndex + 1 : 0;
  if (dateCol === -1) dateCol = 0;
  if (descCol === -1) descCol = 1;
  if (debitCol === -1 && creditCol === -1 && amountCol === -1) {
    debitCol = 2;
    creditCol = 3;
  }

  const results: RawParsedTransaction[] = [];

  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    // 1. Date
    const rawDate = row[dateCol];
    const date = normalizeDate(rawDate);
    if (!date) continue; // Skip non-transaction or summary rows

    // 2. Description
    const rawDesc = descCol !== -1 && row[descCol] ? String(row[descCol]).trim() : "Bank Transaction";
    if (!rawDesc || /^(?:opening balance|closing balance|total|summary)/i.test(rawDesc)) {
      continue;
    }

    // 3. Amount & Type
    let amount: number | null = null;
    let type: "income" | "expense" = "expense";

    const debitAmt = debitCol !== -1 ? parseAmount(row[debitCol]) : null;
    const creditAmt = creditCol !== -1 ? parseAmount(row[creditCol]) : null;

    if (debitAmt !== null && debitAmt > 0 && (creditAmt === null || creditAmt <= 0)) {
      amount = debitAmt;
      type = "expense";
    } else if (creditAmt !== null && creditAmt > 0 && (debitAmt === null || debitAmt <= 0)) {
      amount = creditAmt;
      type = "income";
    } else if (amountCol !== -1) {
      const rawAmt = parseAmount(row[amountCol]);
      if (rawAmt !== null && rawAmt > 0) {
        amount = rawAmt;

        // Check explicit type column first (e.g. "income" vs "expense" or "credit" vs "debit")
        if (typeCol !== -1 && row[typeCol]) {
          const t = String(row[typeCol]).toLowerCase().trim();
          if (
            t === "income" ||
            t.includes("credit") ||
            t === "cr" ||
            t.startsWith("cr/") ||
            t === "+"
          ) {
            type = "income";
          } else if (
            t === "expense" ||
            t.includes("debit") ||
            t === "dr" ||
            t.startsWith("dr/") ||
            t === "-"
          ) {
            type = "expense";
          }
        } else {
          const rawCell = String(row[amountCol]).toLowerCase();
          if (rawCell.includes("cr") || rawCell.includes("credit")) {
            type = "income";
          } else if (String(row[amountCol]).startsWith("-")) {
            type = "expense";
          } else {
            type = "expense";
          }
        }
      }
    }

    if (amount === null || amount <= 0) continue;

    const refNo = refCol !== -1 && row[refCol] ? String(row[refCol]).trim() : undefined;
    const rawCategory = catCol !== -1 && row[catCol] ? String(row[catCol]).trim() : undefined;
    const cleanTitle = cleanNarrationToTitle(rawDesc);

    results.push({
      date,
      rawDescription: rawDesc,
      cleanTitle,
      amount,
      type,
      referenceNumber: refNo,
      rawCategory: rawCategory && rawCategory.toLowerCase() !== "uncategorized" ? rawCategory : undefined,
      rawRowIndex: r,
    });
  }

  return results;
}

/**
 * Parse a PDF buffer with optional password using pdfjs-dist
 */
export async function parsePdfBuffer(
  buffer: Buffer,
  password?: string,
): Promise<RawParsedTransaction[]> {
  let pdfjs: any;
  try {
    pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  } catch (err: any) {
    throw new Error(`PDF engine initialization failed: ${err?.message || err}`);
  }

  const uint8 = new Uint8Array(buffer);

  let doc: any;
  try {
    const loadingTask = pdfjs.getDocument({
      data: uint8,
      password: password || undefined,
      isEvalSupported: false,
      useSystemFonts: true,
    });

    doc = await loadingTask.promise;
  } catch (err: any) {
    // PasswordException handling
    if (err?.name === "PasswordException" || err?.code === 1 || err?.code === 2) {
      throw new StatementPasswordError(!!password);
    }
    throw new Error(`Failed to read PDF document: ${err?.message || err}`);
  }

  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    // Group text items by roughly equal Y-coordinates into lines
    const lineMap: Record<number, { x: number; text: string }[]> = {};

    for (const item of content.items as any[]) {
      if (!item.str || !item.str.trim()) continue;
      const y = Math.round(item.transform[5] / 3) * 3; // Bucket Y coordinate
      const x = item.transform[4];

      if (!lineMap[y]) lineMap[y] = [];
      lineMap[y].push({ x, text: item.str });
    }

    // Sort lines from top of page to bottom (descending Y)
    const sortedY = Object.keys(lineMap)
      .map(Number)
      .sort((a, b) => b - a);

    for (const y of sortedY) {
      // Sort tokens inside line from left to right (ascending X)
      const tokens = lineMap[y].sort((a, b) => a.x - b.x);
      const lineStr = tokens.map((t) => t.text).join(" ").trim();
      if (lineStr) {
        lines.push(lineStr);
      }
    }
  }

  return parsePdfLines(lines);
}

/**
 * Extract financial transaction rows from PDF lines
 */
export function parsePdfLines(lines: string[]): RawParsedTransaction[] {
  const results: RawParsedTransaction[] = [];
  const dateRegex = /\b(\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4}|\d{1,2}[\/\s-][A-Za-z]{3}[\/\s-]\d{2,4})\b/;

  let currentRow: { date: string; narration: string; nums: number[] } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Check if line starts with or contains a transaction date
    const dateMatch = line.match(dateRegex);

    if (dateMatch && dateMatch.index !== undefined && dateMatch.index < 15) {
      // Commit previous row if pending
      if (currentRow) {
        processPdfCandidate(currentRow, results, results.length);
      }

      const dateStr = normalizeDate(dateMatch[1]);
      if (dateStr) {
        const afterDate = line.replace(dateMatch[0], "").trim();
        const extractedNumbers = extractNumbersFromLine(afterDate);
        const textOnly = afterDate.replace(/[\d,]+\.\d{2}/g, "").trim();

        currentRow = {
          date: dateStr,
          narration: textOnly,
          nums: extractedNumbers,
        };
        continue;
      }
    }

    // If continuation line of multi-line narration
    if (currentRow) {
      const moreNums = extractNumbersFromLine(line);
      if (moreNums.length > 0) {
        currentRow.nums.push(...moreNums);
      }
      const textOnly = line.replace(/[\d,]+\.\d{2}/g, "").trim();
      if (textOnly && textOnly.length > 1) {
        currentRow.narration += " " + textOnly;
      }
    }
  }

  if (currentRow) {
    processPdfCandidate(currentRow, results, results.length);
  }

  return results;
}

function extractNumbersFromLine(str: string): number[] {
  const matches = str.match(/\b\d{1,3}(?:,\d{2,3})*\.\d{2}\b/g);
  if (!matches) return [];
  return matches
    .map((m) => parseFloat(m.replace(/,/g, "")))
    .filter((n) => !isNaN(n) && n > 0);
}

function processPdfCandidate(
  cand: { date: string; narration: string; nums: number[] },
  results: RawParsedTransaction[],
  index: number,
) {
  if (!cand.date || cand.nums.length === 0) return;

  // Typical statement row has: [Amount, Balance] or [Debit, Credit, Balance]
  let amount = cand.nums[0];
  let type: "income" | "expense" = "expense";

  const lowerNarr = cand.narration.toLowerCase();

  // If explicit CR or CREDIT marker present
  if (lowerNarr.includes("cr") || lowerNarr.includes("credit") || lowerNarr.includes("refund") || lowerNarr.includes("interest")) {
    type = "income";
  } else {
    type = "expense";
  }

  // Filter out balance-only or non-actionable rows
  if (/^(?:opening balance|closing balance|total withdrawal|total deposit|b\/f)/i.test(cand.narration)) {
    return;
  }

  const cleanTitle = cleanNarrationToTitle(cand.narration);

  results.push({
    date: cand.date,
    rawDescription: cand.narration.trim(),
    cleanTitle,
    amount,
    type,
    rawRowIndex: index,
  });
}

/**
 * Universal file entrypoint that inspects file extension/mime, checks password, and extracts transactions
 */
export async function parseStatementFile(
  buffer: Buffer,
  fileName: string,
  password?: string,
): Promise<ParseResult> {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  try {
    if (ext === "csv" || ext === "txt") {
      const txns = parseCsvBuffer(buffer);
      return {
        success: true,
        fileType: "csv",
        fileName,
        transactions: txns,
      };
    }

    if (ext === "xlsx" || ext === "xls") {
      const txns = await parseExcelBuffer(buffer, password);
      return {
        success: true,
        fileType: "excel",
        fileName,
        transactions: txns,
      };
    }

    if (ext === "pdf") {
      const txns = await parsePdfBuffer(buffer, password);
      return {
        success: true,
        fileType: "pdf",
        fileName,
        transactions: txns,
      };
    }

    // Try Excel as fallback for unknown spreadsheet formats
    try {
      const txns = await parseExcelBuffer(buffer, password);
      return {
        success: true,
        fileType: "excel",
        fileName,
        transactions: txns,
      };
    } catch {
      throw new Error(`Unsupported file type ".${ext}". Please upload a CSV, Excel (.xlsx/.xls), or PDF file.`);
    }
  } catch (err: any) {
    if (err instanceof StatementPasswordError) {
      return {
        success: false,
        requiresPassword: true,
        invalidPassword: err.invalidPassword,
        error: err.message,
        fileType: (ext === "pdf" ? "pdf" : "excel"),
        fileName,
        transactions: [],
      };
    }

    throw err;
  }
}
