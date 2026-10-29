import type { Response } from "express";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { getFamilyForUser } from "../services/familyService.js";
import {
  getReportPreview,
  generateCSVReport,
  generateExcelReport,
  generatePDFReport,
  type ReportFilters,
} from "../services/reportService.js";

function parseReportFilters(query: any): ReportFilters {
  const filters: ReportFilters = {};

  if (typeof query.startDate === "string" && query.startDate.trim()) {
    filters.startDate = query.startDate.trim();
  }

  if (typeof query.endDate === "string" && query.endDate.trim()) {
    filters.endDate = query.endDate.trim();
  }

  if (
    query.type === "all" ||
    query.type === "income" ||
    query.type === "expense"
  ) {
    filters.type = query.type;
  }

  if (query.categoryIds) {
    const raw = Array.isArray(query.categoryIds)
      ? query.categoryIds
      : String(query.categoryIds).split(",");
    const parsed = raw.map((x: any) => parseInt(x, 10)).filter((n: number) => !isNaN(n));
    if (parsed.length > 0) filters.categoryIds = parsed;
  }

  if (query.memberIds) {
    const raw = Array.isArray(query.memberIds)
      ? query.memberIds
      : String(query.memberIds).split(",");
    const parsed = raw.map((x: any) => parseInt(x, 10)).filter((n: number) => !isNaN(n));
    if (parsed.length > 0) filters.memberIds = parsed;
  }

  return filters;
}

export async function getReportPreviewController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const filters = parseReportFilters(req.query);
    const preview = await getReportPreview(family.family_id, filters);

    res.json({
      success: true,
      data: preview,
    });
  } catch (error: any) {
    console.error("Failed to generate report preview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate report preview.",
    });
  }
}

export async function exportReportController(
  req: AuthenticatedRequest,
  res: Response,
) {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required." });
      return;
    }

    const family = await getFamilyForUser(userId);
    if (!family) {
      res.status(403).json({ success: false, message: "User does not belong to a family." });
      return;
    }

    const filters = parseReportFilters(req.query);
    const format = String(req.query.format || "csv").toLowerCase();
    const dateStamp = new Date().toISOString().slice(0, 10);

    if (format === "xlsx" || format === "excel") {
      const buffer = await generateExcelReport(
        family.family_id,
        family.name,
        filters,
      );
      const filename = `family_report_${dateStamp}.xlsx`;

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
      return;
    }

    if (format === "pdf") {
      const buffer = await generatePDFReport(
        family.family_id,
        family.name,
        filters,
      );
      const filename = `family_statement_${dateStamp}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.status(200).send(buffer);
      return;
    }

    // Default: CSV
    const csvData = await generateCSVReport(family.family_id, filters);
    const filename = `family_transactions_${dateStamp}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvData);
  } catch (error: any) {
    console.error("Failed to export report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to export report.",
    });
  }
}
