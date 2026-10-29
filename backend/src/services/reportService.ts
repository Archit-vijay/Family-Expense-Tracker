import pool from "../config/database.js";
import * as XLSX from "xlsx";
import PDFDocument from "pdfkit";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  memberIds?: number[];
  type?: "all" | "income" | "expense";
}

export interface ReportTransaction {
  id: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  category_id: number;
  member_name: string;
  member_id: number;
  transaction_date: string;
  created_at: string;
}

export interface CategoryBreakdownItem {
  name: string;
  type: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface MemberBreakdownItem {
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface ReportPreviewData {
  transactionCount: number;
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
  categoryBreakdown: CategoryBreakdownItem[];
  memberBreakdown: MemberBreakdownItem[];
  sampleTransactions: ReportTransaction[];
}

/**
 * Fetch transactions matching specific date, category, member, and type filters
 */
export async function getFilteredTransactions(
  familyId: number,
  filters: ReportFilters = {},
): Promise<ReportTransaction[]> {
  let query = `
    SELECT
      t.id,
      t.title,
      t.amount::float AS amount,
      t.type,
      COALESCE(c.name, 'Uncategorized') AS category,
      COALESCE(t.category_id, 0) AS category_id,
      COALESCE(fm.name, 'Unknown') AS member_name,
      COALESCE(t.member_id, 0) AS member_id,
      TO_CHAR(t.transaction_date, 'YYYY-MM-DD') AS transaction_date,
      TO_CHAR(t.created_at, 'YYYY-MM-DD HH24:MI:SS') AS created_at
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN family_members fm ON fm.id = t.member_id
    WHERE t.family_id = $1
      AND t.is_deleted = FALSE
  `;

  const values: any[] = [familyId];
  let paramIdx = 2;

  if (filters.startDate) {
    query += ` AND t.transaction_date >= $${paramIdx++}`;
    values.push(filters.startDate);
  }

  if (filters.endDate) {
    query += ` AND t.transaction_date <= $${paramIdx++}`;
    values.push(filters.endDate);
  }

  if (filters.type && filters.type !== "all") {
    query += ` AND t.type = $${paramIdx++}`;
    values.push(filters.type);
  }

  if (filters.categoryIds && filters.categoryIds.length > 0) {
    query += ` AND t.category_id = ANY($${paramIdx++}::int[])`;
    values.push(filters.categoryIds);
  }

  if (filters.memberIds && filters.memberIds.length > 0) {
    query += ` AND t.member_id = ANY($${paramIdx++}::int[])`;
    values.push(filters.memberIds);
  }

  query += ` ORDER BY t.transaction_date DESC, t.id DESC`;

  const result = await pool.query(query, values);
  return result.rows;
}

/**
 * Generates an aggregated summary preview of matching transactions
 */
export async function getReportPreview(
  familyId: number,
  filters: ReportFilters = {},
): Promise<ReportPreviewData> {
  const transactions = await getFilteredTransactions(familyId, filters);

  let totalIncome = 0;
  let totalExpenses = 0;

  const categoryMap = new Map<string, { type: string; amount: number; count: number }>();
  const memberMap = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    if (t.type === "income") {
      totalIncome += t.amount;
    } else {
      totalExpenses += t.amount;
    }

    // Category aggregation
    const catKey = `${t.category}:::${t.type}`;
    const existingCat = categoryMap.get(catKey) || { type: t.type, amount: 0, count: 0 };
    existingCat.amount += t.amount;
    existingCat.count += 1;
    categoryMap.set(catKey, existingCat);

    // Member aggregation
    const existingMember = memberMap.get(t.member_name) || { amount: 0, count: 0 };
    existingMember.amount += t.amount;
    existingMember.count += 1;
    memberMap.set(t.member_name, existingMember);
  }

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Build category breakdown
  const categoryBreakdown: CategoryBreakdownItem[] = [];
  for (const [key, val] of categoryMap.entries()) {
    const [name] = key.split(":::");
    const baseTotal = val.type === "expense" ? totalExpenses : totalIncome;
    const percentage = baseTotal > 0 ? Math.round((val.amount / baseTotal) * 100) : 0;
    categoryBreakdown.push({
      name,
      type: val.type,
      amount: Math.round(val.amount),
      count: val.count,
      percentage,
    });
  }
  categoryBreakdown.sort((a, b) => b.amount - a.amount);

  // Build member breakdown
  const memberBreakdown: MemberBreakdownItem[] = [];
  const grandTotal = totalIncome + totalExpenses;
  for (const [name, val] of memberMap.entries()) {
    const percentage = grandTotal > 0 ? Math.round((val.amount / grandTotal) * 100) : 0;
    memberBreakdown.push({
      name,
      amount: Math.round(val.amount),
      count: val.count,
      percentage,
    });
  }
  memberBreakdown.sort((a, b) => b.amount - a.amount);

  return {
    transactionCount: transactions.length,
    totalIncome: Math.round(totalIncome),
    totalExpenses: Math.round(totalExpenses),
    netSavings: Math.round(netSavings),
    savingsRate,
    dateRange: {
      startDate: filters.startDate || (transactions.length > 0 ? transactions[transactions.length - 1].transaction_date : null),
      endDate: filters.endDate || (transactions.length > 0 ? transactions[0].transaction_date : null),
    },
    categoryBreakdown,
    memberBreakdown,
    sampleTransactions: transactions.slice(0, 10),
  };
}

/**
 * Generates RFC-4180 compliant CSV string with UTF-8 BOM
 */
export async function generateCSVReport(
  familyId: number,
  filters: ReportFilters = {},
): Promise<string> {
  const transactions = await getFilteredTransactions(familyId, filters);

  const escape = (val: any) => {
    if (val === null || val === undefined) return '""';
    const s = String(val).replace(/"/g, '""');
    return `"${s}"`;
  };

  const headers = [
    "Transaction ID",
    "Title",
    "Amount (INR)",
    "Type",
    "Category",
    "Family Member",
    "Transaction Date",
    "Created At",
  ];

  const rows = transactions.map((t) => [
    escape(t.id),
    escape(t.title),
    escape(t.amount),
    escape(t.type),
    escape(t.category),
    escape(t.member_name),
    escape(t.transaction_date),
    escape(t.created_at),
  ]);

  // UTF-8 BOM prefix (\uFEFF) ensures Excel opens non-ASCII and rupee representations correctly
  return (
    "\uFEFF" + [headers.join(","), ...rows.map((row) => row.join(","))].join("\r\n")
  );
}

/**
 * Generates an Excel spreadsheet (.xlsx) with Summary and Transactions sheets
 */
export async function generateExcelReport(
  familyId: number,
  familyName: string,
  filters: ReportFilters = {},
): Promise<Buffer> {
  const transactions = await getFilteredTransactions(familyId, filters);
  const preview = await getReportPreview(familyId, filters);

  const wb = XLSX.utils.book_new();

  // 1. Executive Summary Sheet
  const summaryAoa: any[][] = [
    ["FAMILY FINANCE — FINANCIAL REPORT"],
    ["Family:", familyName],
    ["Generated:", new Date().toLocaleString("en-IN")],
    [
      "Period:",
      preview.dateRange.startDate && preview.dateRange.endDate
        ? `${preview.dateRange.startDate} to ${preview.dateRange.endDate}`
        : "All Recorded Transactions",
    ],
    [],
    ["FINANCIAL OVERVIEW (INR)"],
    ["Metric", "Value"],
    ["Total Transactions", preview.transactionCount],
    ["Total Income", preview.totalIncome],
    ["Total Expenses", preview.totalExpenses],
    ["Net Savings", preview.netSavings],
    ["Savings Rate (%)", `${preview.savingsRate}%`],
    [],
    ["CATEGORY BREAKDOWN"],
    ["Category", "Type", "Total (INR)", "Transactions", "% of Total"],
  ];

  for (const c of preview.categoryBreakdown) {
    summaryAoa.push([c.name, c.type.toUpperCase(), c.amount, c.count, `${c.percentage}%`]);
  }

  summaryAoa.push([]);
  summaryAoa.push(["FAMILY MEMBER BREAKDOWN"]);
  summaryAoa.push(["Member", "Total (INR)", "Transactions", "% of Activity"]);

  for (const m of preview.memberBreakdown) {
    summaryAoa.push([m.name, m.amount, m.count, `${m.percentage}%`]);
  }

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryAoa);
  summarySheet["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // 2. All Transactions Sheet
  const txData = transactions.map((t) => ({
    "ID": t.id,
    "Date": t.transaction_date,
    "Title": t.title,
    "Type": t.type.toUpperCase(),
    "Category": t.category,
    "Family Member": t.member_name,
    "Amount (INR)": t.amount,
  }));

  const txSheet = XLSX.utils.json_to_sheet(txData);
  txSheet["!cols"] = [
    { wch: 8 },
    { wch: 12 },
    { wch: 28 },
    { wch: 10 },
    { wch: 20 },
    { wch: 18 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, txSheet, "Transactions");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

/**
 * Generates an executive, branded PDF Financial Statement
 */
export async function generatePDFReport(
  familyId: number,
  familyName: string,
  filters: ReportFilters = {},
): Promise<Buffer> {
  const transactions = await getFilteredTransactions(familyId, filters);
  const preview = await getReportPreview(familyId, filters);

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margin: 40,
        info: {
          Title: `Family Finance Statement - ${familyName}`,
          Author: "Family Finance",
        },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err: Error) => reject(err));

      const primaryDark = "#2A234F";
      const blushPink = "#FFB3C3";
      const mutedText = "#77738A";
      const greenText = "#059669";
      const roseText = "#E11D48";
      const borderStroke = "#E8E5EF";

      // --- Header Brand ---
      doc.rect(40, 40, doc.page.width - 80, 5).fill(primaryDark);

      doc.moveDown(1);
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .fillColor(primaryDark)
        .text("FAMILY FINANCE", 40, 55);

      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor(mutedText)
        .text("OFFICIAL FINANCIAL SUMMARY STATEMENT", 40, 80);

      // Top Right Meta Info
      const periodText =
        preview.dateRange.startDate && preview.dateRange.endDate
          ? `${preview.dateRange.startDate} to ${preview.dateRange.endDate}`
          : "All Recorded Transactions";

      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor(primaryDark)
        .text(`Family: ${familyName}`, 340, 55, { align: "right" });

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(mutedText)
        .text(`Period: ${periodText}`, 340, 68, { align: "right" });

      doc
        .fontSize(8)
        .fillColor(mutedText)
        .text(`Generated: ${new Date().toLocaleDateString("en-IN")}`, 340, 81, { align: "right" });

      doc
        .moveTo(40, 98)
        .lineTo(doc.page.width - 40, 98)
        .lineWidth(1)
        .strokeColor(blushPink)
        .stroke();

      // --- Executive KPI Summary Cards ---
      const cardY = 115;
      const cardWidth = (doc.page.width - 80 - 20) / 3;
      const cardHeight = 65;

      // Card 1: Income
      doc.roundedRect(40, cardY, cardWidth, cardHeight, 6).fillAndStroke("#F8F7FB", borderStroke);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedText).text("TOTAL INCOME", 52, cardY + 12);
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(greenText)
        .text(`₹${preview.totalIncome.toLocaleString("en-IN")}`, 52, cardY + 28);

      // Card 2: Expenses
      const card2X = 40 + cardWidth + 10;
      doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 6).fillAndStroke("#F8F7FB", borderStroke);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedText).text("TOTAL EXPENSES", card2X + 12, cardY + 12);
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(roseText)
        .text(`₹${preview.totalExpenses.toLocaleString("en-IN")}`, card2X + 12, cardY + 28);

      // Card 3: Net Cashflow
      const card3X = card2X + cardWidth + 10;
      doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 6).fillAndStroke("#F8F7FB", borderStroke);
      doc.fontSize(8).font("Helvetica-Bold").fillColor(mutedText).text("NET SAVINGS", card3X + 12, cardY + 12);
      const netColor = preview.netSavings >= 0 ? greenText : roseText;
      const sign = preview.netSavings >= 0 ? "+" : "";
      doc
        .fontSize(16)
        .font("Helvetica-Bold")
        .fillColor(netColor)
        .text(`${sign}₹${preview.netSavings.toLocaleString("en-IN")}`, card3X + 12, cardY + 28);

      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor(mutedText)
        .text(`Savings rate: ${preview.savingsRate}%`, card3X + 12, cardY + 48);

      // --- Category Breakdown Table ---
      let currentY = 195;
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(primaryDark)
        .text("Category Spending Breakdown", 40, currentY);

      currentY += 16;
      doc.rect(40, currentY, doc.page.width - 80, 20).fill("#2A234F");

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("Category", 50, currentY + 6);
      doc.text("Type", 220, currentY + 6);
      doc.text("Transactions", 320, currentY + 6);
      doc.text("Amount (INR)", 410, currentY + 6);
      doc.text("Share", 495, currentY + 6);

      currentY += 20;

      const topCategories = preview.categoryBreakdown.slice(0, 8);
      for (let i = 0; i < topCategories.length; i++) {
        const cat = topCategories[i];
        if (i % 2 === 1) {
          doc.rect(40, currentY, doc.page.width - 80, 18).fill("#F8F7FB");
        }

        doc.fontSize(8).font("Helvetica").fillColor(primaryDark);
        doc.text(cat.name, 50, currentY + 5);
        doc.text(cat.type.toUpperCase(), 220, currentY + 5);
        doc.text(String(cat.count), 335, currentY + 5);
        doc.text(`₹${cat.amount.toLocaleString("en-IN")}`, 410, currentY + 5);
        doc.text(`${cat.percentage}%`, 500, currentY + 5);

        currentY += 18;
      }

      // --- Transaction Log ---
      currentY += 15;
      doc
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(primaryDark)
        .text(
          `Transaction Log (${Math.min(25, transactions.length)} of ${transactions.length} items)`,
          40,
          currentY,
        );

      currentY += 16;
      doc.rect(40, currentY, doc.page.width - 80, 20).fill("#2A234F");

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
      doc.text("Date", 50, currentY + 6);
      doc.text("Title", 130, currentY + 6);
      doc.text("Category", 280, currentY + 6);
      doc.text("Member", 390, currentY + 6);
      doc.text("Amount", 480, currentY + 6);

      currentY += 20;

      const txSubset = transactions.slice(0, 25);
      for (let i = 0; i < txSubset.length; i++) {
        // If approaching page bottom, add new page
        if (currentY > doc.page.height - 60) {
          doc.addPage();
          currentY = 40;
          doc.rect(40, currentY, doc.page.width - 80, 20).fill("#2A234F");
          doc.fontSize(8).font("Helvetica-Bold").fillColor("#FFFFFF");
          doc.text("Date", 50, currentY + 6);
          doc.text("Title", 130, currentY + 6);
          doc.text("Category", 280, currentY + 6);
          doc.text("Member", 390, currentY + 6);
          doc.text("Amount", 480, currentY + 6);
          currentY += 20;
        }

        const t = txSubset[i];
        if (i % 2 === 1) {
          doc.rect(40, currentY, doc.page.width - 80, 17).fill("#F8F7FB");
        }

        doc.fontSize(8).font("Helvetica").fillColor(primaryDark);
        doc.text(t.transaction_date, 50, currentY + 4);
        doc.text(t.title.slice(0, 24), 130, currentY + 4);
        doc.text(t.category.slice(0, 18), 280, currentY + 4);
        doc.text(t.member_name.slice(0, 16), 390, currentY + 4);

        const amtColor = t.type === "income" ? greenText : roseText;
        const amtSign = t.type === "income" ? "+" : "-";
        doc
          .fontSize(8)
          .font("Helvetica-Bold")
          .fillColor(amtColor)
          .text(`${amtSign}₹${t.amount.toLocaleString("en-IN")}`, 470, currentY + 4);

        currentY += 17;
      }

      // Footer
      const footerY = doc.page.height - 35;
      doc
        .moveTo(40, footerY - 5)
        .lineTo(doc.page.width - 40, footerY - 5)
        .lineWidth(0.5)
        .strokeColor(borderStroke)
        .stroke();

      doc
        .fontSize(7)
        .font("Helvetica")
        .fillColor(mutedText)
        .text(
          "Family Finance — Confidential Household Statement • Amounts in Indian Rupee (INR)",
          40,
          footerY,
          { align: "center" },
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
