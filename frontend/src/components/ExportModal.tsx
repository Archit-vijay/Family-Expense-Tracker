import { useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
  Loader2,
  Table,
  Users,
  X,
} from "lucide-react";
import { getReportPreview, downloadReport } from "../services/reportService";
import type { ExportFormat, ReportFilters, ReportPreviewData } from "../types/report";
import type { Category } from "../services/categoryService";
import type { FamilyMember } from "../services/familyMemberService";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  members: FamilyMember[];
}

type DatePreset = "all" | "this-month" | "last-month" | "last-3-months" | "this-year" | "custom";

function getDatePresetRange(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  if (preset === "this-month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    return { startDate: start.toISOString().slice(0, 10), endDate: todayStr };
  }

  if (preset === "last-month") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0));
    return { startDate: start.toISOString().slice(0, 10), endDate: end.toISOString().slice(0, 10) };
  }

  if (preset === "last-3-months") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
    return { startDate: start.toISOString().slice(0, 10), endDate: todayStr };
  }

  if (preset === "this-year") {
    const start = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    return { startDate: start.toISOString().slice(0, 10), endDate: todayStr };
  }

  return { startDate: "", endDate: "" };
}

export default function ExportModal({
  isOpen,
  onClose,
  categories,
  members,
}: ExportModalProps) {
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [preset, setPreset] = useState<DatePreset>("this-month");
  const [startDate, setStartDate] = useState(() => getDatePresetRange("this-month").startDate);
  const [endDate, setEndDate] = useState(() => getDatePresetRange("this-month").endDate);
  const [txType, setTxType] = useState<"all" | "income" | "expense">("all");
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);

  const [preview, setPreview] = useState<ReportPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync dates when preset changes
  function handlePresetChange(newPreset: DatePreset) {
    setPreset(newPreset);
    if (newPreset !== "custom") {
      const range = getDatePresetRange(newPreset);
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }

  // Build active filters
  const activeFilters: ReportFilters = {
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    type: txType,
    categoryIds: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
    memberIds: selectedMemberIds.length > 0 ? selectedMemberIds : undefined,
  };

  // Fetch preview on filter change
  useEffect(() => {
    if (!isOpen) return;

    let isCurrent = true;
    setIsLoadingPreview(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const data = await getReportPreview(activeFilters);
        if (isCurrent) {
          setPreview(data);
        }
      } catch (err: any) {
        if (isCurrent) {
          setError(err?.message || "Failed to calculate report preview.");
        }
      } finally {
        if (isCurrent) {
          setIsLoadingPreview(false);
        }
      }
    }, 200);

    return () => {
      isCurrent = false;
      clearTimeout(timer);
    };
  }, [
    isOpen,
    startDate,
    endDate,
    txType,
    selectedCategoryIds,
    selectedMemberIds,
  ]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleDownload() {
    try {
      setIsDownloading(true);
      setError(null);
      await downloadReport(activeFilters, format);
      onClose();
    } catch (err: any) {
      console.error("Export download failed:", err);
      setError(err?.message || "Failed to download report file.");
    } finally {
      setIsDownloading(false);
    }
  }

  function toggleCategory(catId: number) {
    setSelectedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId],
    );
  }

  function toggleMember(memberId: number) {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId],
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#2a234f]/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl dark:border dark:border-[#2e265c] dark:bg-[#161130] animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#e8e5ef] px-6 py-5 dark:border-[#2e265c]">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffb3c3]/30 text-[#2a234f] dark:bg-[#ffb3c3]/20 dark:text-[#ffb3c3]">
                <Download size={22} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                  Export Financial Reports
                </h2>
                <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                  Customize filters and export statements or spreadsheets
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="rounded-xl p-2 text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:bg-[#201844] dark:hover:text-[#f5f3fa]"
            >
              <X size={20} />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-6 py-5 space-y-6">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300">
                {error}
              </div>
            )}

            {/* 1. Format Selection */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#77738a] dark:text-[#a5a0ba]">
                1. Select Export Format
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {/* PDF */}
                <button
                  type="button"
                  onClick={() => setFormat("pdf")}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    format === "pdf"
                      ? "border-[#ff859d] bg-[#fff5f7] shadow-sm ring-2 ring-[#ff859d]/30 dark:border-[#ff859d] dark:bg-[#281a38]"
                      : "border-[#e8e5ef] bg-white hover:border-[#ffb3c3] hover:bg-[#f8f7fb] dark:border-[#2e265c] dark:bg-[#1a1438] dark:hover:bg-[#201844]"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 dark:bg-rose-950/40">
                    <FileText size={18} />
                  </div>
                  <h4 className="mt-2.5 text-sm font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                    PDF Statement
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#77738a] dark:text-[#a5a0ba]">
                    Formatted summary statement with KPI cards & category charts.
                  </p>
                </button>

                {/* Excel */}
                <button
                  type="button"
                  onClick={() => setFormat("xlsx")}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    format === "xlsx"
                      ? "border-[#ff859d] bg-[#fff5f7] shadow-sm ring-2 ring-[#ff859d]/30 dark:border-[#ff859d] dark:bg-[#281a38]"
                      : "border-[#e8e5ef] bg-white hover:border-[#ffb3c3] hover:bg-[#f8f7fb] dark:border-[#2e265c] dark:bg-[#1a1438] dark:hover:bg-[#201844]"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/40">
                    <FileSpreadsheet size={18} />
                  </div>
                  <h4 className="mt-2.5 text-sm font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                    Excel (.xlsx)
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#77738a] dark:text-[#a5a0ba]">
                    Multi-sheet workbook with Summary tab + detailed rows.
                  </p>
                </button>

                {/* CSV */}
                <button
                  type="button"
                  onClick={() => setFormat("csv")}
                  className={`flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${
                    format === "csv"
                      ? "border-[#ff859d] bg-[#fff5f7] shadow-sm ring-2 ring-[#ff859d]/30 dark:border-[#ff859d] dark:bg-[#281a38]"
                      : "border-[#e8e5ef] bg-white hover:border-[#ffb3c3] hover:bg-[#f8f7fb] dark:border-[#2e265c] dark:bg-[#1a1438] dark:hover:bg-[#201844]"
                  }`}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-950/40">
                    <Table size={18} />
                  </div>
                  <h4 className="mt-2.5 text-sm font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                    CSV (.csv)
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-[#77738a] dark:text-[#a5a0ba]">
                    Standard raw records with UTF-8 BOM for spreadsheet tools.
                  </p>
                </button>
              </div>
            </div>

            {/* 2. Date Range & Presets */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#77738a] dark:text-[#a5a0ba]">
                2. Statement Period
              </label>

              {/* Presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  { key: "this-month", label: "This Month" },
                  { key: "last-month", label: "Last Month" },
                  { key: "last-3-months", label: "Last 3 Months" },
                  { key: "this-year", label: "This Year" },
                  { key: "all", label: "All Time" },
                  { key: "custom", label: "Custom" },
                ].map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => handlePresetChange(p.key as DatePreset)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      preset === p.key
                        ? "bg-[#2a234f] text-white shadow-xs dark:bg-[#382e6e]"
                        : "border border-[#e8e5ef] bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:border-[#2e265c] dark:bg-[#1a1438] dark:text-[#a5a0ba]"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#77738a] dark:text-[#a5a0ba]">
                    From Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPreset("custom");
                      }}
                      className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs font-medium text-[#2a234f] outline-none transition focus:border-[#ff859d] focus:ring-2 focus:ring-[#ff859d]/20 dark:border-[#2e265c] dark:bg-[#1a1438] dark:text-[#f5f3fa]"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-semibold text-[#77738a] dark:text-[#a5a0ba]">
                    To Date
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPreset("custom");
                      }}
                      className="h-10 w-full rounded-xl border border-[#e8e5ef] bg-white px-3 text-xs font-medium text-[#2a234f] outline-none transition focus:border-[#ff859d] focus:ring-2 focus:ring-[#ff859d]/20 dark:border-[#2e265c] dark:bg-[#1a1438] dark:text-[#f5f3fa]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Transaction Type & Granular Filters */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-[#77738a] dark:text-[#a5a0ba]">
                3. Filters & Specifics
              </label>

              {/* Type Selector */}
              <div className="flex h-10 w-full rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-1 dark:border-[#2e265c] dark:bg-[#120d2b] mb-3">
                <button
                  type="button"
                  onClick={() => setTxType("all")}
                  className={`flex-1 rounded-lg text-xs font-bold transition ${
                    txType === "all"
                      ? "bg-[#2a234f] text-white shadow-xs dark:bg-[#2e265c]"
                      : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba]"
                  }`}
                >
                  All Transactions
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("expense")}
                  className={`flex-1 rounded-lg text-xs font-bold transition ${
                    txType === "expense"
                      ? "bg-[#2a234f] text-white shadow-xs dark:bg-[#2e265c]"
                      : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba]"
                  }`}
                >
                  Expenses Only
                </button>
                <button
                  type="button"
                  onClick={() => setTxType("income")}
                  className={`flex-1 rounded-lg text-xs font-bold transition ${
                    txType === "income"
                      ? "bg-[#2a234f] text-white shadow-xs dark:bg-[#2e265c]"
                      : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba]"
                  }`}
                >
                  Income Only
                </button>
              </div>

              {/* Dropdown accordions for Categories and Members */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {/* Category Filter */}
                <div className="rounded-xl border border-[#e8e5ef] bg-white p-3 dark:border-[#2e265c] dark:bg-[#1a1438]">
                  <button
                    type="button"
                    onClick={() => setIsCategoryPickerOpen(!isCategoryPickerOpen)}
                    className="flex w-full items-center justify-between text-xs font-semibold text-[#2a234f] dark:text-[#f5f3fa]"
                  >
                    <span className="flex items-center gap-2">
                      <Filter size={14} className="text-[#ff859d]" />
                      <span>
                        Categories ({selectedCategoryIds.length === 0 ? "All" : `${selectedCategoryIds.length} selected`})
                      </span>
                    </span>
                    {isCategoryPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isCategoryPickerOpen && (
                    <div className="mt-3 max-h-40 overflow-y-auto space-y-1 pt-2 border-t border-[#e8e5ef] dark:border-[#2e265c]">
                      <div className="flex justify-end gap-2 pb-1">
                        <button
                          type="button"
                          onClick={() => setSelectedCategoryIds([])}
                          className="text-[10px] font-semibold text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba]"
                        >
                          Select All
                        </button>
                      </div>
                      {categories.map((c) => {
                        const isChecked = selectedCategoryIds.includes(c.id);
                        return (
                          <label
                            key={c.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#2a234f] hover:bg-[#f8f7fb] cursor-pointer dark:text-[#f5f3fa] dark:hover:bg-[#221a48]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCategory(c.id)}
                              className="rounded border-[#e8e5ef] text-[#2a234f] focus:ring-0"
                            />
                            <span className="truncate">{c.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Member Filter */}
                <div className="rounded-xl border border-[#e8e5ef] bg-white p-3 dark:border-[#2e265c] dark:bg-[#1a1438]">
                  <button
                    type="button"
                    onClick={() => setIsMemberPickerOpen(!isMemberPickerOpen)}
                    className="flex w-full items-center justify-between text-xs font-semibold text-[#2a234f] dark:text-[#f5f3fa]"
                  >
                    <span className="flex items-center gap-2">
                      <Users size={14} className="text-[#ff859d]" />
                      <span>
                        Family Members ({selectedMemberIds.length === 0 ? "All" : `${selectedMemberIds.length} selected`})
                      </span>
                    </span>
                    {isMemberPickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  {isMemberPickerOpen && (
                    <div className="mt-3 max-h-40 overflow-y-auto space-y-1 pt-2 border-t border-[#e8e5ef] dark:border-[#2e265c]">
                      <div className="flex justify-end gap-2 pb-1">
                        <button
                          type="button"
                          onClick={() => setSelectedMemberIds([])}
                          className="text-[10px] font-semibold text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba]"
                        >
                          Select All
                        </button>
                      </div>
                      {members.map((m) => {
                        const isChecked = selectedMemberIds.includes(m.id);
                        return (
                          <label
                            key={m.id}
                            className="flex items-center gap-2 rounded-lg px-2 py-1 text-xs text-[#2a234f] hover:bg-[#f8f7fb] cursor-pointer dark:text-[#f5f3fa] dark:hover:bg-[#221a48]"
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleMember(m.id)}
                              className="rounded border-[#e8e5ef] text-[#2a234f] focus:ring-0"
                            />
                            <span className="truncate">{m.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Live Preview Box */}
            <div className="rounded-2xl border border-[#e8e5ef] bg-[#f8f7fb]/70 p-4 dark:border-[#2e265c] dark:bg-[#120d2b]/60">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                  Report Scope Preview
                </span>
                {isLoadingPreview && (
                  <span className="flex items-center gap-1.5 text-[11px] text-[#77738a] dark:text-[#a5a0ba]">
                    <Loader2 size={12} className="animate-spin text-[#ff859d]" />
                    <span>Calculating scope...</span>
                  </span>
                )}
              </div>

              {preview ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-white p-3 border border-[#e8e5ef] dark:bg-[#1a1438] dark:border-[#2e265c]">
                    <p className="text-[10px] font-semibold text-[#77738a] dark:text-[#a5a0ba]">
                      MATCHING RECORDS
                    </p>
                    <p className="mt-1 text-base font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                      {preview.transactionCount}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[#e8e5ef] dark:bg-[#1a1438] dark:border-[#2e265c]">
                    <p className="text-[10px] font-semibold text-[#77738a] dark:text-[#a5a0ba]">
                      TOTAL INCOME
                    </p>
                    <p className="mt-1 text-base font-bold text-emerald-600 dark:text-emerald-400">
                      ₹{preview.totalIncome.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[#e8e5ef] dark:bg-[#1a1438] dark:border-[#2e265c]">
                    <p className="text-[10px] font-semibold text-[#77738a] dark:text-[#a5a0ba]">
                      TOTAL EXPENSES
                    </p>
                    <p className="mt-1 text-base font-bold text-rose-600 dark:text-rose-400">
                      ₹{preview.totalExpenses.toLocaleString("en-IN")}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3 border border-[#e8e5ef] dark:bg-[#1a1438] dark:border-[#2e265c]">
                    <p className="text-[10px] font-semibold text-[#77738a] dark:text-[#a5a0ba]">
                      NET CASHFLOW
                    </p>
                    <p
                      className={`mt-1 text-base font-bold ${
                        preview.netSavings >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {preview.netSavings >= 0 ? "+" : ""}₹{preview.netSavings.toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-[#77738a] dark:text-[#a5a0ba]">
                  No preview available
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-[#e8e5ef] px-6 py-4 dark:border-[#2e265c] bg-[#f8f7fb]/50 dark:bg-[#120d2b]/40">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-[#77738a] transition hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-[#f5f3fa]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading || (preview?.transactionCount === 0)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-[#1f1a3b] active:scale-95 disabled:opacity-50 dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e] dark:border dark:border-[#4d4090]/80"
            >
              {isDownloading ? (
                <>
                  <Loader2 size={15} className="animate-spin text-[#ffb3c3]" />
                  <span>Preparing {format.toUpperCase()}...</span>
                </>
              ) : (
                <>
                  <Download size={15} />
                  <span>
                    Download {format.toUpperCase()} (
                    {preview ? preview.transactionCount : 0} items)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
