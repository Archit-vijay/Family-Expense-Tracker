import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  KeyRound,
  Loader2,
  Lock,
  RotateCcw,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

import { parseStatement, commitStatementImport } from "../services/transactionService";
import type { Category } from "../services/categoryService";
import type { FamilyMember } from "../services/familyMemberService";
import type {
  StagedImportTransaction,
  StatementParseSummary,
} from "../types/Transaction";

interface StatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  members: FamilyMember[];
  onImportComplete: () => Promise<void>;
}

export default function StatementImportModal({
  isOpen,
  onClose,
  categories,
  members,
  onImportComplete,
}: StatementImportModalProps) {
  // Step: 1 = upload, 2 = review & categorize
  const [step, setStep] = useState<1 | 2>(1);

  // File & Member state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<number>(() => {
    return members.length > 0 ? members[0].id : 0;
  });

  // Password state (for encrypted files)
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Parsing & Loading states
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  // Staged data
  const [parsedTransactions, setParsedTransactions] = useState<StagedImportTransaction[]>([]);
  const [summary, setSummary] = useState<StatementParseSummary | null>(null);
  const [rememberMappings, setRememberMappings] = useState(true);

  // Filter in review step: 'all' | 'ready' | 'duplicates'
  const [filterTab, setFilterTab] = useState<"all" | "ready" | "duplicates">("ready");

  // Commit state
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitError, setCommitError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Update default member if members load later
  useEffect(() => {
    if (selectedMemberId === 0 && members.length > 0) {
      setSelectedMemberId(members[0].id);
    }
  }, [members, selectedMemberId]);

  // Reset modal state on open/close
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedFile(null);
      setRequiresPassword(false);
      setPassword("");
      setPasswordError(null);
      setIsParsing(false);
      setParseError(null);
      setParsedTransactions([]);
      setSummary(null);
      setCommitError(null);
      setFilterTab("ready");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Drag & Drop
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileSelected(file);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
    }
  }

  function handleFileSelected(file: File) {
    setSelectedFile(file);
    setParseError(null);
    setRequiresPassword(false);
    setPassword("");
    setPasswordError(null);
  }

  // Trigger parsing (checks for password automatically)
  async function handleScanAndParse(withPassword?: string) {
    if (!selectedFile) {
      setParseError("Please select a bank statement file to parse.");
      return;
    }

    try {
      setIsParsing(true);
      setParseError(null);
      setPasswordError(null);

      const res = await parseStatement(selectedFile, withPassword);

      if (!res.success && res.requiresPassword) {
        setRequiresPassword(true);
        if (res.invalidPassword) {
          setPasswordError(res.message || "Incorrect password. Please verify and try again.");
        }
        return;
      }

      if (!res.transactions || res.transactions.length === 0) {
        setParseError(
          res.message ||
            "No transaction rows could be found in this statement. Please check the file format.",
        );
        return;
      }

      setParsedTransactions(res.transactions);
      setSummary(res.summary || null);
      setRequiresPassword(false);
      setStep(2);
    } catch (err: any) {
      setParseError(err?.message || "Failed to parse bank statement file.");
    } finally {
      setIsParsing(false);
    }
  }

  // Row selection toggle
  function handleToggleRow(id: string) {
    setParsedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t)),
    );
  }

  // Select all or Deselect all
  function handleToggleAll(select: boolean) {
    setParsedTransactions((prev) =>
      prev.map((t) => {
        // If selecting all, select non-duplicates
        if (select) {
          return { ...t, selected: true };
        }
        return { ...t, selected: false };
      }),
    );
  }

  // Change category for a specific row
  function handleCategoryChange(id: string, newCategoryId: number) {
    const targetCat = categories.find((c) => c.id === newCategoryId);
    if (!targetCat) return;

    setParsedTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              suggestedCategoryId: targetCat.id,
              suggestedCategoryName: targetCat.name,
              confidence: "learned", // Manual adjustment counts as learned
            }
          : t,
      ),
    );
  }

  // Change clean title for a row
  function handleTitleChange(id: string, newTitle: string) {
    setParsedTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, cleanTitle: newTitle } : t)),
    );
  }

  // Filtered list based on current tab
  const displayedTransactions = useMemo(() => {
    if (filterTab === "ready") {
      return parsedTransactions.filter((t) => !t.isDuplicate);
    }
    if (filterTab === "duplicates") {
      return parsedTransactions.filter((t) => t.isDuplicate);
    }
    return parsedTransactions;
  }, [parsedTransactions, filterTab]);

  const selectedCount = parsedTransactions.filter((t) => t.selected).length;

  // Commit batch import
  async function handleCommitImport() {
    const toImport = parsedTransactions.filter((t) => t.selected);
    if (toImport.length === 0) {
      setCommitError("Please select at least one transaction to import.");
      return;
    }

    if (!selectedMemberId) {
      setCommitError("Please select a family member.");
      return;
    }

    try {
      setIsCommitting(true);
      setCommitError(null);

      await commitStatementImport({
        memberId: selectedMemberId,
        rememberMappings,
        transactions: toImport.map((t) => ({
          title: t.cleanTitle,
          amount: t.amount,
          type: t.type,
          transactionDate: t.date,
          categoryId: t.suggestedCategoryId,
        })),
      });

      await onImportComplete();
      onClose();
    } catch (err: any) {
      setCommitError(err?.message || "Failed to commit transactions to database.");
    } finally {
      setIsCommitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#0c081c]/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Surface */}
      <div
        className={`relative z-10 w-full ${
          step === 1 ? "max-w-xl" : "max-w-5xl"
        } rounded-3xl border border-[#e8e5ef] bg-white shadow-2xl transition-all duration-300 dark:border-[#2e265c] dark:bg-[#181236] max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8e5ef] px-6 py-5 dark:border-[#2e265c]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffb3c3]/20 text-[#2a234f] dark:text-[#ffb3c3]">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                  {step === 1 ? "Import Bank Statement" : "Review & Categorize Statement"}
                </h2>
                <span className="rounded-full bg-[#ffb3c3]/20 px-2 py-0.5 text-[10px] font-bold text-[#2a234f] dark:text-[#ffb3c3]">
                  CSV · Excel · PDF
                </span>
              </div>
              <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                {step === 1
                  ? "Auto-extract and categorize transactions with smart deduplication."
                  : `Parsed from ${selectedFile?.name || "statement"}`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:bg-[#201744] dark:hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ================= STEP 1: UPLOAD & PASSWORD CHECK ================= */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Family Member Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#77738a] dark:text-[#c4c1d6] mb-2">
                  Who does this statement belong to?
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {members.map((m) => {
                    const isSelected = selectedMemberId === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMemberId(m.id)}
                        className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-[#2a234f] bg-[#2a234f]/5 ring-2 ring-[#2a234f]/10 dark:border-[#ffb3c3] dark:bg-[#ffb3c3]/10 dark:ring-[#ffb3c3]/20"
                            : "border-[#e8e5ef] bg-white hover:border-[#2a234f]/30 dark:border-[#2e265c] dark:bg-[#110c26] dark:hover:border-[#ffb3c3]/40"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                            isSelected
                              ? "bg-[#2a234f] text-[#ffb3c3] dark:bg-[#ffb3c3] dark:text-[#17132f]"
                              : "bg-[#f8f7fb] text-[#2a234f] dark:bg-[#201744] dark:text-[#f5f3fa]"
                          }`}
                        >
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate">
                          <p className="truncate text-xs font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                            {m.name}
                          </p>
                          <p className="text-[10px] text-[#77738a] dark:text-[#a5a0ba] capitalize">
                            {m.role}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Upload Dropzone */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.pdf"
                className="hidden"
                onChange={handleFileInputChange}
              />

              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center transition-all duration-200 cursor-pointer ${
                  selectedFile
                    ? "border-[#ffb3c3] bg-[#ffb3c3]/5 dark:border-[#ffb3c3]/60 dark:bg-[#ffb3c3]/5"
                    : "border-[#e8e5ef] bg-[#f8f7fb]/70 hover:border-[#2a234f]/40 dark:border-[#2e265c] dark:bg-[#110c26] dark:hover:border-[#ffb3c3]/40"
                }`}
              >
                {selectedFile ? (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ffb3c3]/20 text-[#2a234f] dark:text-[#ffb3c3]">
                      <FileText size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                        {selectedFile.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[#77738a] dark:text-[#a5a0ba]">
                        {(selectedFile.size / 1024).toFixed(1)} KB · Tap to change file
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a234f]/5 text-[#2a234f] dark:bg-white/5 dark:text-[#ffb3c3]">
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                        Drop your bank statement here, or{" "}
                        <span className="text-[#2a234f] underline decoration-[#ffb3c3] dark:text-[#ffb3c3]">
                          browse
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-[#77738a] dark:text-[#a5a0ba]">
                        Supports official statements in CSV, Excel (.xlsx, .xls), and PDF
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Password Prompt Alert (Appears automatically only if the file is encrypted) */}
              {requiresPassword && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-500/30 dark:bg-amber-950/30 space-y-3 fade-up">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                        This statement is password-protected
                      </h4>
                      <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
                        Your bank encrypted this file. Please enter the password to decrypt and parse your transactions.
                      </p>
                    </div>
                  </div>

                  {/* Password Input Field */}
                  <div className="relative mt-2">
                    <div className="relative flex items-center">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter statement password (e.g. PAN or DOB)..."
                        className="h-11 w-full rounded-xl border border-amber-300 bg-white px-3.5 pr-10 text-xs text-[#2a234f] outline-none transition placeholder:text-[#9a96a8] focus:border-[#2a234f] dark:border-amber-500/40 dark:bg-[#110c26] dark:text-[#f5f3fa]"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && password.trim()) {
                            handleScanAndParse(password);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        className="absolute right-3 text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {passwordError && (
                      <p className="mt-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        {passwordError}
                      </p>
                    )}
                  </div>

                  {/* Bank Password Cheat Sheet Helper */}
                  <div className="rounded-xl bg-white/70 p-3 text-[11px] text-amber-900/80 dark:bg-[#181236]/70 dark:text-amber-300/80 space-y-1">
                    <p className="font-semibold text-amber-900 dark:text-amber-200">
                      💡 Common Bank Password Patterns:
                    </p>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                      <li>
                        <strong>HDFC / ICICI / Kotak:</strong> Your PAN number in CAPITALS or Customer ID.
                      </li>
                      <li>
                        <strong>SBI:</strong> Date of Birth (DDMMYYYY) + Last 4 digits of Account number.
                      </li>
                      <li>
                        <strong>Axis:</strong> First 4 letters of name (CAPITALS) + DOB (DDMM).
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Parse Error Display */}
              {parseError && (
                <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/30 dark:text-rose-300">
                  <AlertCircle size={16} className="shrink-0 text-rose-500" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!selectedFile || isParsing || (requiresPassword && !password.trim())}
                  onClick={() => handleScanAndParse(requiresPassword ? password : undefined)}
                  className="group relative flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2a234f] text-sm font-semibold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f1a3b] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e] dark:border dark:border-[#4d4090]/80 dark:text-[#f5f3fa]"
                >
                  {isParsing ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#ffb3c3]" />
                      <span>Analyzing & Parsing Statement...</span>
                    </>
                  ) : requiresPassword ? (
                    <>
                      <KeyRound size={16} className="text-[#ffb3c3]" />
                      <span>Unlock & Scan Statement</span>
                    </>
                  ) : (
                    <>
                      <span>Scan & Parse Statement</span>
                      <ArrowRight size={16} className="text-[#ffb3c3] transition group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: REVIEW & CATEGORIZE ================= */}
          {step === 2 && (
            <div className="space-y-5">
              {/* Summary Stats Badges */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-[#e8e5ef] bg-[#f8f7fb]/70 p-3 dark:border-[#2e265c] dark:bg-[#110c26]">
                  <p className="text-[11px] font-medium text-[#77738a] dark:text-[#a5a0ba]">Total Detected</p>
                  <p className="mt-1 text-xl font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                    {summary?.totalCount ?? parsedTransactions.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-500/30 dark:bg-emerald-950/20">
                  <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">Ready to Import</p>
                  <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-400">
                    {summary?.newCount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-500/30 dark:bg-amber-950/20">
                  <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300">Duplicates Skipped</p>
                  <p className="mt-1 text-xl font-bold text-amber-700 dark:text-amber-400">
                    {summary?.duplicatesCount ?? 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3 dark:border-rose-500/30 dark:bg-rose-950/20">
                  <p className="text-[11px] font-medium text-rose-800 dark:text-rose-300">Total Expenses</p>
                  <p className="mt-1 text-xl font-bold text-rose-700 dark:text-rose-400">
                    ₹{summary?.totalExpenseAmount.toLocaleString("en-IN") ?? 0}
                  </p>
                </div>
              </div>

              {/* Sub-header controls: Filter tabs & Select All */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                {/* Tabs */}
                <div className="inline-flex rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-1 text-xs font-semibold dark:border-[#2e265c] dark:bg-[#110c26]">
                  <button
                    type="button"
                    onClick={() => setFilterTab("ready")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      filterTab === "ready"
                        ? "bg-white text-[#2a234f] shadow-xs dark:bg-[#1f1742] dark:text-[#ffb3c3]"
                        : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-white"
                    }`}
                  >
                    Ready ({summary?.newCount ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("duplicates")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      filterTab === "duplicates"
                        ? "bg-white text-[#2a234f] shadow-xs dark:bg-[#1f1742] dark:text-[#ffb3c3]"
                        : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-white"
                    }`}
                  >
                    Duplicates ({summary?.duplicatesCount ?? 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterTab("all")}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      filterTab === "all"
                        ? "bg-white text-[#2a234f] shadow-xs dark:bg-[#1f1742] dark:text-[#ffb3c3]"
                        : "text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-white"
                    }`}
                  >
                    All ({parsedTransactions.length})
                  </button>
                </div>

                {/* Bulk Select Toggles */}
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-[#77738a] dark:text-[#a5a0ba]">
                    <strong>{selectedCount}</strong> selected
                  </span>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="font-semibold text-[#2a234f] underline hover:text-[#ff7895] dark:text-[#ffb3c3] dark:hover:text-[#ffccd6]"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-white"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Transactions Staging Table */}
              <div className="overflow-hidden rounded-2xl border border-[#e8e5ef] dark:border-[#2e265c]">
                <div className="max-h-[380px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="sticky top-0 z-10 bg-[#f8f7fb] text-[11px] font-bold uppercase tracking-wider text-[#77738a] dark:bg-[#120d28] dark:text-[#a5a0ba]">
                      <tr>
                        <th className="py-3 px-3 w-10 text-center">
                          <span className="sr-only">Select</span>
                        </th>
                        <th className="py-3 px-3 w-28">Date</th>
                        <th className="py-3 px-3">Merchant / Payee</th>
                        <th className="py-3 px-3 w-24">Type</th>
                        <th className="py-3 px-3 w-28">Amount</th>
                        <th className="py-3 px-3 w-48">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8e5ef] bg-white dark:divide-[#2e265c] dark:bg-[#181236]">
                      {displayedTransactions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-[#77738a] dark:text-[#a5a0ba]">
                            No transactions in this view.
                          </td>
                        </tr>
                      ) : (
                        displayedTransactions.map((item) => {
                          const isExpense = item.type === "expense";
                          return (
                            <tr
                              key={item.id}
                              className={`transition hover:bg-[#f8f7fb]/60 dark:hover:bg-[#110c26]/60 ${
                                item.selected ? "" : "opacity-50"
                              }`}
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={item.selected}
                                  onChange={() => handleToggleRow(item.id)}
                                  className="h-4 w-4 rounded border-[#e8e5ef] accent-[#2a234f] cursor-pointer dark:accent-[#ffb3c3]"
                                />
                              </td>

                              {/* Date */}
                              <td className="py-3 px-3 whitespace-nowrap font-medium text-[#2a234f] dark:text-[#f5f3fa]">
                                {item.date}
                              </td>

                              {/* Merchant / Description */}
                              <td className="py-3 px-3">
                                <div className="space-y-0.5 max-w-xs sm:max-w-sm">
                                  <input
                                    type="text"
                                    value={item.cleanTitle}
                                    onChange={(e) => handleTitleChange(item.id, e.target.value)}
                                    className="w-full font-bold text-[#2a234f] bg-transparent outline-none border-b border-transparent hover:border-[#e8e5ef] focus:border-[#ffb3c3] dark:text-[#f5f3fa] dark:hover:border-[#2e265c]"
                                  />
                                  <p
                                    className="truncate text-[10px] text-[#77738a] dark:text-[#a5a0ba]"
                                    title={item.rawDescription}
                                  >
                                    {item.rawDescription}
                                  </p>
                                </div>
                              </td>

                              {/* Type Pill */}
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isExpense
                                      ? "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                                      : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>

                              {/* Amount */}
                              <td className="py-3 px-3 whitespace-nowrap font-extrabold">
                                <span
                                  className={
                                    isExpense
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-emerald-600 dark:text-emerald-400"
                                  }
                                >
                                  {isExpense ? "-" : "+"}₹{item.amount.toLocaleString("en-IN")}
                                </span>
                              </td>

                              {/* Category Dropdown */}
                              <td className="py-3 px-3">
                                <div className="space-y-1">
                                  <select
                                    value={item.suggestedCategoryId}
                                    onChange={(e) =>
                                      handleCategoryChange(item.id, Number(e.target.value))
                                    }
                                    className="h-8 w-full rounded-lg border border-[#e8e5ef] bg-white px-2 text-xs font-semibold text-[#2a234f] outline-none transition focus:border-[#ffb3c3] dark:border-[#2e265c] dark:bg-[#110c26] dark:text-[#f5f3fa]"
                                  >
                                    {categories
                                      .filter((c) => c.type === item.type)
                                      .map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                          {cat.name}
                                        </option>
                                      ))}
                                  </select>

                                  {/* Confidence / Match Badge */}
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    {item.isDuplicate ? (
                                      <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
                                        <AlertTriangle size={11} />
                                        Duplicate (will skip)
                                      </span>
                                    ) : item.confidence === "learned" ? (
                                      <span className="flex items-center gap-1 text-purple-600 dark:text-purple-300">
                                        <Sparkles size={11} />
                                        Learned from family
                                      </span>
                                    ) : item.confidence === "rule" ? (
                                      <span className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                                        <Check size={11} />
                                        Auto-matched
                                      </span>
                                    ) : (
                                      <span className="text-[#9a96a8] dark:text-[#726b8e]">
                                        Default
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Options: Remember Mappings */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-[#2a234f] dark:text-[#c4c1d6]">
                  <input
                    type="checkbox"
                    checked={rememberMappings}
                    onChange={(e) => setRememberMappings(e.target.checked)}
                    className="h-4 w-4 rounded border-[#e8e5ef] accent-[#2a234f] dark:accent-[#ffb3c3]"
                  />
                  <span>Remember these merchant category choices for future imports</span>
                </label>

                {commitError && (
                  <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {commitError}
                  </p>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="flex items-center justify-between border-t border-[#e8e5ef] pt-4 dark:border-[#2e265c]">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e5ef] bg-white px-4 py-2.5 text-xs font-semibold text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:border-[#2e265c] dark:bg-[#110c26] dark:text-[#a5a0ba] dark:hover:text-white"
                >
                  <RotateCcw size={14} />
                  <span>Choose Another File</span>
                </button>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-xl px-4 py-2.5 text-xs font-semibold text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:bg-[#201744] dark:hover:text-white"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    disabled={selectedCount === 0 || isCommitting}
                    onClick={handleCommitImport}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-6 py-2.5 text-xs font-bold text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f1a3b] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e] dark:border dark:border-[#4d4090]/80 dark:text-[#f5f3fa]"
                  >
                    {isCommitting ? (
                      <>
                        <Loader2 size={15} className="animate-spin text-[#ffb3c3]" />
                        <span>Importing {selectedCount} Transactions...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={15} className="text-[#ffb3c3]" />
                        <span>Confirm & Import ({selectedCount})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
