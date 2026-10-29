import { API_URL, authFetch } from "./apiClient";
import type { ExportFormat, ReportFilters, ReportPreviewData } from "../types/report";

export async function getReportPreview(
  filters: ReportFilters = {},
): Promise<ReportPreviewData> {
  const params = new URLSearchParams();
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.type && filters.type !== "all") params.append("type", filters.type);
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    params.append("categoryIds", filters.categoryIds.join(","));
  }
  if (filters.memberIds && filters.memberIds.length > 0) {
    params.append("memberIds", filters.memberIds.join(","));
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/reports/preview${queryString}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to load report preview");
  }

  const json = await res.json();
  return json.data;
}

export async function downloadReport(
  filters: ReportFilters = {},
  format: ExportFormat = "pdf",
): Promise<void> {
  const params = new URLSearchParams();
  params.append("format", format);
  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.type && filters.type !== "all") params.append("type", filters.type);
  if (filters.categoryIds && filters.categoryIds.length > 0) {
    params.append("categoryIds", filters.categoryIds.join(","));
  }
  if (filters.memberIds && filters.memberIds.length > 0) {
    params.append("memberIds", filters.memberIds.join(","));
  }

  const queryString = params.toString() ? `?${params.toString()}` : "";
  const res = await authFetch(`${API_URL}/reports/export${queryString}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || "Failed to download report");
  }

  // Get filename from response header or default
  const disposition = res.headers.get("content-disposition");
  let filename = `family_report_${new Date().toISOString().slice(0, 10)}.${format}`;
  if (disposition && disposition.includes("filename=")) {
    const match = /filename=["']?([^"';]+)["']?/.exec(disposition);
    if (match && match[1]) {
      filename = match[1];
    }
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
