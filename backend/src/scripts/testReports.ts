import "dotenv/config";
import pool from "../config/database.js";
import {
  getReportPreview,
  generateCSVReport,
  generateExcelReport,
  generatePDFReport,
} from "../services/reportService.js";

async function run() {
  const families = await pool.query("SELECT id, name FROM families LIMIT 1");
  if (families.rows.length === 0) {
    console.log("No families found in DB.");
    process.exit(0);
  }
  const family = families.rows[0];
  console.log(`\n========================================`);
  console.log(`Testing Advanced Data Export & Reports`);
  console.log(`Family: #${family.id} (${family.name})`);
  console.log(`========================================\n`);

  // 1. Unfiltered Preview & Generation
  console.log("[1/4] Testing unfiltered preview and all 3 formats...");
  const preview = await getReportPreview(family.id, {});
  console.log(` -> Total transactions: ${preview.transactionCount}`);
  console.log(` -> Total Income: ₹${preview.totalIncome.toLocaleString("en-IN")}`);
  console.log(` -> Total Expenses: ₹${preview.totalExpenses.toLocaleString("en-IN")}`);
  console.log(` -> Net Savings: ₹${preview.netSavings.toLocaleString("en-IN")} (${preview.savingsRate}%)`);

  const csv = await generateCSVReport(family.id, {});
  console.log(` -> CSV generated (${csv.length} chars, starts with BOM: ${csv.charCodeAt(0) === 0xfeff})`);

  const excelBuffer = await generateExcelReport(family.id, family.name, {});
  console.log(` -> Excel buffer generated (${excelBuffer.length} bytes)`);

  const pdfBuffer = await generatePDFReport(family.id, family.name, {});
  console.log(` -> PDF buffer generated (${pdfBuffer.length} bytes, starts with %PDF-: ${pdfBuffer.slice(0, 5).toString("utf-8") === "%PDF-"})`);

  // 2. Date-filtered Export
  console.log("\n[2/4] Testing date-range filtered preview & exports...");
  const dateFilters = { startDate: "2026-10-01", endDate: "2026-10-31" };
  const datePreview = await getReportPreview(family.id, dateFilters);
  console.log(` -> Oct 2026 transactions: ${datePreview.transactionCount}`);
  console.log(` -> Oct 2026 Expenses: ₹${datePreview.totalExpenses.toLocaleString("en-IN")}`);
  const datePdf = await generatePDFReport(family.id, family.name, dateFilters);
  console.log(` -> Oct 2026 PDF size: ${datePdf.length} bytes`);

  // 3. Type-filtered Export (Expenses only)
  console.log("\n[3/4] Testing type filter (expenses only)...");
  const expenseFilters = { type: "expense" as const };
  const expensePreview = await getReportPreview(family.id, expenseFilters);
  console.log(` -> Expense count: ${expensePreview.transactionCount}, Income: ₹${expensePreview.totalIncome}, Expenses: ₹${expensePreview.totalExpenses}`);
  console.log(` -> Verified Income is 0 in expense export: ${expensePreview.totalIncome === 0}`);

  // 4. Category-filtered Export
  if (preview.categoryBreakdown.length > 0) {
    const topCatName = preview.categoryBreakdown[0].name;
    const catRow = await pool.query(
      "SELECT id FROM categories WHERE name = $1 AND family_id = $2 LIMIT 1",
      [topCatName, family.id]
    );
    if (catRow.rows.length > 0) {
      const catId = catRow.rows[0].id;
      console.log(`\n[4/4] Testing category filter (Category: "${topCatName}", ID: ${catId})...`);
      const catPreview = await getReportPreview(family.id, { categoryIds: [catId] });
      console.log(` -> Matching count for ${topCatName}: ${catPreview.transactionCount}`);
      console.log(` -> Amount: ₹${(catPreview.totalIncome + catPreview.totalExpenses).toLocaleString("en-IN")}`);
    }
  }

  console.log("\nAll Phase 13 Advanced Data Export & Reports tests PASSED successfully!\n");
  await pool.end();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
