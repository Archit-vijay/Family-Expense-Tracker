import {
  AlertCircle,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FolderPlus,
  KeyRound,
  Laptop,
  Loader2,
  Moon,
  Sun,
  SunMoon,
  Lock,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  User,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import ContentState from "../components/ContentState";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  getSecurityStatus,
  setupTwoFactor,
  updateProfile,
  verifyPasswordForEmail,
} from "../services/authService";
import {
  downloadTransactionsCSV,
  getMyFamily,
  regenerateFamilyCode,
  renameFamily,
} from "../services/familyService";
import {
  createCategory,
  deleteCategory,
  getCategories,
  type Category,
} from "../services/categoryService";
import { clearChatSession } from "../services/chatStorageService";
import { getFamilyMembers, type FamilyMember } from "../services/familyMemberService";
import ExportModal from "../components/ExportModal";

type SettingsTab = "profile" | "family" | "categories" | "data";

function getMaskedEmail(email: string): string {
  if (!email) return "••••••••••••••••";
  const [userPart, domainPart] = email.split("@");
  if (!domainPart) return "••••••••••••••••";
  const maskedUser =
    userPart.length <= 2
      ? userPart[0] + "••••"
      : userPart.slice(0, 2) + "••••••" + userPart.slice(-1);
  const domainParts = domainPart.split(".");
  const domainName = domainParts[0];
  const maskedDomain =
    domainName.length <= 2 ? "••••" : domainName.slice(0, 1) + "•••••";
  const ext = domainParts.length > 1 ? "." + domainParts.slice(1).join(".") : "";
  return `${maskedUser}@${maskedDomain}${ext}`;
}

function Settings() {
  const { user, familyRole, updateUser, refreshFamily } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Email Reveal State
  const [revealedEmail, setRevealedEmail] = useState<string | null>(null);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealPassword, setRevealPassword] = useState("");
  const [showRevealPassword, setShowRevealPassword] = useState(false);
  const [isVerifyingReveal, setIsVerifyingReveal] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);

  // Tab 1: Profile & Password State
  const [nameInput, setNameInput] = useState(user?.name || "");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null);

  // 2FA State
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // 2FA Setup Flow
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isStartingSetup, setIsStartingSetup] = useState(false);
  const [totpSecret, setTotpSecret] = useState("");
  const [totpQrCode, setTotpQrCode] = useState("");
  const [totpCodeInput, setTotpCodeInput] = useState("");
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // 2FA Disable Flow
  const [isDisableModalOpen, setIsDisableModalOpen] = useState(false);
  const [disablePasswordInput, setDisablePasswordInput] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [disableError, setDisableError] = useState<string | null>(null);

  // Tab 2: Family Workspace State
  const [familyNameInput, setFamilyNameInput] = useState("");
  const [familyCode, setFamilyCode] = useState<string | null>(null);
  const [isUpdatingFamily, setIsUpdatingFamily] = useState(false);
  const [isRegeneratingCode, setIsRegeneratingCode] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [familySuccess, setFamilySuccess] = useState<string | null>(null);
  const [familyError, setFamilyError] = useState<string | null>(null);

  // Tab 3: Custom Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryType, setCategoryType] = useState<"expense" | "income">("expense");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [categorySuccess, setCategorySuccess] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Tab 4: AI & Data State
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [chatCleared, setChatCleared] = useState(false);

  // Enforce role-based tab visibility: fallback if unauthorized tab is active
  useEffect(() => {
    if (activeTab === "family" && familyRole !== "admin") {
      setActiveTab("profile");
    } else if (activeTab === "categories" && familyRole === "viewer") {
      setActiveTab("profile");
    }
  }, [activeTab, familyRole]);

  // Load initial settings and security data
  useEffect(() => {
    let isCurrent = true;

    async function loadData() {
      try {
        const [familyData, cats, secStatus, mems] = await Promise.all([
          getMyFamily().catch(() => null),
          getCategories().catch(() => []),
          getSecurityStatus().catch(() => ({
            isTwoFactorEnabled: false,
            passwordChangedAt: null,
          })),
          getFamilyMembers().catch(() => []),
        ]);

        if (isCurrent) {
          if (familyData) {
            setFamilyNameInput(familyData.familyName || "");
            setFamilyCode(familyData.familyCode || null);
          }
          setCategories(cats);
          setMembers(mems);
          if (secStatus) {
            setIsTwoFactorEnabled(secStatus.isTwoFactorEnabled);
            setPasswordChangedAt(secStatus.passwordChangedAt);
          }
        }
      } finally {
        if (isCurrent) {
          setIsPageLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isCurrent = false;
    };
  }, []);

  // Sync user name input if user changes
  useEffect(() => {
    if (user?.name) {
      setNameInput(user.name);
    }
  }, [user?.name]);

  // Handle Profile Update
  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setProfileError("Name must be at least 2 characters.");
      return;
    }

    try {
      setIsUpdatingName(true);
      setProfileError(null);
      setProfileSuccess(null);
      const updated = await updateProfile(nameInput.trim());
      updateUser(updated);
      setProfileSuccess("Your profile name has been updated.");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.message || "Failed to update profile name.");
    } finally {
      setIsUpdatingName(false);
    }
  }

  // Handle Email Reveal Password Verification
  async function handleVerifyPasswordToReveal(e: React.FormEvent) {
    e.preventDefault();
    if (!revealPassword) {
      setRevealError("Please enter your account password.");
      return;
    }

    try {
      setIsVerifyingReveal(true);
      setRevealError(null);
      const email = await verifyPasswordForEmail(revealPassword);
      setRevealedEmail(email);
      setIsRevealModalOpen(false);
      setRevealPassword("");
    } catch (err: any) {
      setRevealError(err?.message || "Incorrect password.");
    } finally {
      setIsVerifyingReveal(false);
    }
  }

  // Handle Password Change
  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("Please fill in all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordError(null);
      setPasswordSuccess(null);
      const res = await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Your password has been changed successfully.");
      if (res.data?.passwordChangedAt) {
        setPasswordChangedAt(res.data.passwordChangedAt);
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  // Handle Start 2FA Setup
  async function handleStart2FASetup() {
    try {
      setIsStartingSetup(true);
      setTwoFactorError(null);
      setSetupError(null);
      setTotpCodeInput("");
      const setupData = await setupTwoFactor();
      setTotpSecret(setupData.secret);
      setTotpQrCode(setupData.qrCode || "");
      setIsSetupModalOpen(true);
    } catch (err: any) {
      setTwoFactorError(err?.message || "Failed to initiate 2FA setup.");
    } finally {
      setIsStartingSetup(false);
    }
  }

  // Handle Confirm Enable 2FA
  async function handleConfirmEnable2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!totpCodeInput.trim() || totpCodeInput.trim().length !== 6) {
      setSetupError("Please enter the complete 6-digit code.");
      return;
    }

    try {
      setIsEnabling2FA(true);
      setSetupError(null);
      await enableTwoFactor(totpSecret, totpCodeInput.trim());
      setIsTwoFactorEnabled(true);
      setIsSetupModalOpen(false);
      setTwoFactorSuccess("Two-factor authentication is now active on your account.");
      setTimeout(() => setTwoFactorSuccess(null), 5000);
    } catch (err: any) {
      setSetupError(err?.message || "Invalid 6-digit verification code.");
    } finally {
      setIsEnabling2FA(false);
    }
  }

  // Handle Disable 2FA
  async function handleConfirmDisable2FA(e: React.FormEvent) {
    e.preventDefault();
    if (!disablePasswordInput) {
      setDisableError("Please enter your current account password.");
      return;
    }

    try {
      setIsDisabling2FA(true);
      setDisableError(null);
      await disableTwoFactor(disablePasswordInput);
      setIsTwoFactorEnabled(false);
      setIsDisableModalOpen(false);
      setDisablePasswordInput("");
      setTwoFactorSuccess("Two-factor authentication has been disabled.");
      setTimeout(() => setTwoFactorSuccess(null), 5000);
    } catch (err: any) {
      setDisableError(err?.message || "Incorrect account password.");
    } finally {
      setIsDisabling2FA(false);
    }
  }

  // Handle Copy TOTP Secret
  function handleCopySecret() {
    if (!totpSecret) return;
    navigator.clipboard.writeText(totpSecret);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2500);
  }

  // Handle Family Rename
  async function handleFamilyRename(e: React.FormEvent) {
    e.preventDefault();
    if (familyRole !== "admin") return;
    if (!familyNameInput.trim() || familyNameInput.trim().length < 2) {
      setFamilyError("Family name must be at least 2 characters.");
      return;
    }

    try {
      setIsUpdatingFamily(true);
      setFamilyError(null);
      setFamilySuccess(null);
      await renameFamily(familyNameInput.trim());
      await refreshFamily();
      setFamilySuccess("Family workspace name updated successfully.");
      setTimeout(() => setFamilySuccess(null), 4000);
    } catch (err: any) {
      setFamilyError(err?.message || "Failed to rename family workspace.");
    } finally {
      setIsUpdatingFamily(false);
    }
  }

  // Handle Copy Code
  function handleCopyCode() {
    if (!familyCode) return;
    navigator.clipboard.writeText(familyCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  }

  // Handle Regenerate Code
  async function handleRegenerateCode() {
    if (familyRole !== "admin") return;
    const confirmed = window.confirm(
      "Are you sure you want to regenerate the Family Join Code? The old code will stop working immediately."
    );
    if (!confirmed) return;

    try {
      setIsRegeneratingCode(true);
      setFamilyError(null);
      const newCode = await regenerateFamilyCode();
      setFamilyCode(newCode);
      setFamilySuccess("New family join code generated.");
      setTimeout(() => setFamilySuccess(null), 4000);
    } catch (err: any) {
      setFamilyError(err?.message || "Failed to regenerate family code.");
    } finally {
      setIsRegeneratingCode(false);
    }
  }

  // Handle Create Custom Category
  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError("Please enter a category name.");
      return;
    }

    try {
      setIsAddingCategory(true);
      setCategoryError(null);
      setCategorySuccess(null);
      const newCat = await createCategory(categoryName.trim(), categoryType);
      setCategories((prev) => [...prev, newCat]);
      setCategoryName("");
      setCategorySuccess(`Added "${newCat.name}" to ${categoryType} categories.`);
      setTimeout(() => setCategorySuccess(null), 4000);
    } catch (err: any) {
      setCategoryError(err?.message || "Failed to create category.");
    } finally {
      setIsAddingCategory(false);
    }
  }

  // Handle Delete Category
  async function handleDeleteCategory(cat: Category) {
    if (familyRole !== "admin") return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${cat.name}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setDeletingCategoryId(cat.id);
      setCategoryError(null);
      await deleteCategory(cat.id);
      setCategories((prev) => prev.filter((c) => c.id !== cat.id));
      setCategorySuccess(`Category "${cat.name}" deleted.`);
      setTimeout(() => setCategorySuccess(null), 4000);
    } catch (err: any) {
      setCategoryError(err?.message || "Failed to delete category.");
    } finally {
      setDeletingCategoryId(null);
    }
  }

  // Handle CSV Export
  async function handleExportCSV() {
    try {
      setIsExportingCSV(true);
      await downloadTransactionsCSV();
    } catch (err: any) {
      alert(err?.message || "Failed to export transactions.");
    } finally {
      setIsExportingCSV(false);
    }
  }

  // Handle Clear Chat
  function handleClearChat() {
    const confirmed = window.confirm(
      "Are you sure you want to clear your AI Assistant chat history?"
    );
    if (!confirmed) return;

    clearChatSession(user?.id);
    setChatCleared(true);
    setTimeout(() => setChatCleared(false), 3000);
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="page-enter pb-16">
      {/* Header */}
      <section className="mb-6 fade-up">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-[#77738a]">
          Preferences & Management
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-[#2a234f] sm:text-4xl">
          Account & Workspace Settings
        </h1>
        <p className="mt-2 text-xs text-[#77738a] sm:text-sm">
          Customize profile security, manage family collaboration, configure custom categories, and export data.
        </p>
      </section>

      {/* Tabs Bar with Strict Role-Based Visibility */}
      <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-[#e8e5ef] pb-4">
        {/* Profile & Security Tab (Visible to all) */}
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
            activeTab === "profile"
              ? "bg-[#2a234f] text-white shadow-md shadow-[#2a234f]/15"
              : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
          }`}
        >
          <User size={15} />
          <span>Profile & Security</span>
        </button>

        {/* Family Workspace Tab: ONLY VISIBLE TO ADMINS */}
        {familyRole === "admin" && (
          <button
            type="button"
            onClick={() => setActiveTab("family")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === "family"
                ? "bg-[#2a234f] text-white shadow-md shadow-[#2a234f]/15"
                : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
            }`}
          >
            <Building2 size={15} />
            <span>Family Workspace</span>
          </button>
        )}

        {/* Custom Categories Tab: ONLY VISIBLE TO ADMINS AND MEMBERS (NOT VIEWERS) */}
        {familyRole !== "viewer" && (
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
              activeTab === "categories"
                ? "bg-[#2a234f] text-white shadow-md shadow-[#2a234f]/15"
                : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
            }`}
          >
            <Tag size={15} />
            <span>Custom Categories</span>
            <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {categories.length}
            </span>
          </button>
        )}

        {/* AI & Data Preferences Tab (Visible to all) */}
        <button
          type="button"
          onClick={() => setActiveTab("data")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
            activeTab === "data"
              ? "bg-[#2a234f] text-white shadow-md shadow-[#2a234f]/15"
              : "bg-white text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f]"
          }`}
        >
          <Sparkles size={15} />
          <span>AI & Data Preferences</span>
        </button>
      </div>

      {isPageLoading ? (
        <ContentState
          variant="loading"
          title="Loading settings"
          description="Retrieving family and account preferences..."
        />
      ) : (
        <div className="space-y-6 fade-up">
          {/* TAB 1: PROFILE & SECURITY */}
          {activeTab === "profile" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Profile Details Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3]/30 text-[#2a234f]">
                    <User size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f]">
                      Profile Information
                    </h2>
                    <p className="text-xs text-[#77738a]">
                      Your personal display name and verified login identifier.
                    </p>
                  </div>
                </div>

                {profileSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>{profileSuccess}</span>
                  </div>
                )}

                {profileError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="mt-5 space-y-4">
                  {/* Email row with Hidden Email and Password Reveal */}
                  <div>
                    <div className="mb-1 flex items-center justify-between">
                      <label className="block text-xs font-semibold text-[#77738a]">
                        Email Address (Login ID)
                      </label>
                      {revealedEmail ? (
                        <button
                          type="button"
                          onClick={() => setRevealedEmail(null)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#77738a] hover:text-[#2a234f] transition"
                        >
                          <EyeOff size={13} />
                          <span>Hide Email</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setRevealPassword("");
                            setRevealError(null);
                            setIsRevealModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2a234f] hover:text-[#1f1a3b] underline transition"
                        >
                          <KeyRound size={13} />
                          <span>Reveal Full Email</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <input
                        type="text"
                        value={revealedEmail || getMaskedEmail(user?.email || "")}
                        readOnly
                        className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] px-3.5 pr-10 text-xs font-mono font-medium text-[#2a234f] cursor-default select-all"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77738a]">
                        {revealedEmail ? (
                          <Eye size={16} className="text-emerald-600" />
                        ) : (
                          <Lock size={16} />
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-[#9a96a8]">
                      {revealedEmail
                        ? "Email address is visible for this session. Click Hide Email to re-mask."
                        : "Email address is masked for security. Enter your account password to reveal."}
                    </p>
                  </div>

                  {/* Display Name Input */}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="e.g. John Sharma"
                      className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 text-xs font-semibold text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingName || nameInput.trim() === user?.name}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2a234f] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-[0.99] disabled:opacity-50"
                    >
                      {isUpdatingName ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Profile Changes</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Password Change Card with Security Cooldown */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600">
                    <Lock size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f]">
                      Change Password
                    </h2>
                    <p className="text-xs text-[#77738a]">
                      Secure your account with a strong, private password.
                    </p>
                  </div>
                </div>

                {/* Security Cooldown Badge */}
                <div className="mt-4 flex items-center justify-between rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3 text-xs">
                  <div className="flex items-center gap-2 text-[#2a234f]">
                    <ShieldCheck size={16} className="text-[#2a234f]" />
                    <span className="font-bold">Cooldown Protection:</span>
                  </div>
                  <span className="text-[11px] font-medium text-[#77738a]">
                    {passwordChangedAt
                      ? `Last changed ${new Date(passwordChangedAt).toLocaleDateString()} at ${new Date(
                          passwordChangedAt
                        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : "Never changed yet (1-hr cooldown after update)"}
                  </span>
                </div>

                {passwordSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}

                {passwordError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-3.5">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 pr-10 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77738a] hover:text-[#2a234f]"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      New Password (Min 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPass ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter at least 8 characters"
                        className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 pr-10 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77738a] hover:text-[#2a234f]"
                      >
                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword || !currentPassword || !newPassword}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2a234f] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-[0.99] disabled:opacity-50"
                    >
                      {isUpdatingPassword ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Two-Factor Authentication (2FA) Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e5ef] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a234f] to-[#1f1a3b] text-[#ffb3c3]">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold text-[#2a234f]">
                          Two-Factor Authentication (2FA)
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            isTwoFactorEnabled
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : "bg-[#f8f7fb] text-[#77738a] border border-[#e8e5ef]"
                          }`}
                        >
                          {isTwoFactorEnabled ? "Active & Protected" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-xs text-[#77738a] mt-0.5">
                        Add an extra layer of defense using TOTP authenticator apps (Google Authenticator, Authy, Apple Passwords).
                      </p>
                    </div>
                  </div>

                  <div>
                    {isTwoFactorEnabled ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDisablePasswordInput("");
                          setDisableError(null);
                          setIsDisableModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 active:scale-95"
                      >
                        <Lock size={14} />
                        <span>Disable 2FA</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStart2FASetup}
                        disabled={isStartingSetup}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-95 disabled:opacity-50"
                      >
                        {isStartingSetup ? (
                          <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                        ) : (
                          <ShieldCheck size={14} className="text-[#ffb3c3]" />
                        )}
                        <span>Enable Two-Factor Auth</span>
                      </button>
                    )}
                  </div>
                </div>

                {twoFactorSuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>{twoFactorSuccess}</span>
                  </div>
                )}

                {twoFactorError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{twoFactorError}</span>
                  </div>
                )}

                <div className="mt-5 grid gap-4 sm:grid-cols-3 text-xs">
                  <div className="rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3.5">
                    <p className="font-bold text-[#2a234f] mb-1">Standard RFC 6238</p>
                    <p className="text-[#77738a] text-[11px] leading-relaxed">
                      Compatible with Google Authenticator, Microsoft Authenticator, Authy, and 1Password.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3.5">
                    <p className="font-bold text-[#2a234f] mb-1">Login Verification</p>
                    <p className="text-[#77738a] text-[11px] leading-relaxed">
                      Requires entering a 6-digit verification code from your device during sign in.
                    </p>
                  </div>
                  <div className="rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-3.5">
                    <p className="font-bold text-[#2a234f] mb-1">Encrypted Secret</p>
                    <p className="text-[#77738a] text-[11px] leading-relaxed">
                      Zero third-party token leaks; TOTP calculations run isolated directly on your server.
                    </p>
                  </div>
                </div>
              </div>

              {/* Appearance & Display Theme Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#e8e5ef] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a234f] to-[#1f1a3b] text-[#ffb3c3]">
                      <SunMoon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-bold text-[#2a234f]">
                          Appearance & Display Theme
                        </h2>
                        <span className="rounded-full bg-[#ffb3c3]/20 border border-[#ffb3c3]/40 px-2.5 py-0.5 text-[10px] font-bold text-[#2a234f] uppercase tracking-wider">
                          Active: {theme === "system" ? `System (${resolvedTheme})` : resolvedTheme}
                        </span>
                      </div>
                      <p className="text-xs text-[#77738a] mt-0.5">
                        Choose your visual mode across all pages of the application.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3 Theme Choice Cards */}
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {/* Option 1: Light Theme */}
                  <button
                    type="button"
                    onClick={() => setTheme("light")}
                    className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                      theme === "light"
                        ? "border-[#2a234f] bg-[#ffb3c3]/15 ring-2 ring-[#2a234f]/20 shadow-sm"
                        : "border-[#e8e5ef] bg-white hover:border-[#2a234f]/40 hover:bg-[#f8f7fb]/60"
                    }`}
                  >
                    <div className="mb-3 flex w-full items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Sun size={18} />
                      </div>
                      {theme === "light" && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a234f] text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    {/* Mini Visual Preview Mockup */}
                    <div className="mb-3 h-16 w-full rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-12 rounded-full bg-[#2a234f]/80" />
                        <div className="h-2 w-4 rounded-full bg-[#ffb3c3]" />
                      </div>
                      <div className="h-3 w-16 rounded-full bg-[#2a234f]" />
                      <div className="h-1.5 w-full rounded-full bg-[#e8e5ef]" />
                    </div>

                    <p className="text-xs font-bold text-[#2a234f]">Light Mode</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#77738a]">
                      Clean, high-clarity surfaces with warm blush pink accents and deep navy contrast.
                    </p>
                  </button>

                  {/* Option 2: Dark Theme */}
                  <button
                    type="button"
                    onClick={() => setTheme("dark")}
                    className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                      theme === "dark"
                        ? "border-[#ffb3c3] bg-[#ffb3c3]/15 ring-2 ring-[#ffb3c3]/30 shadow-sm"
                        : "border-[#e8e5ef] bg-white hover:border-[#2a234f]/40 hover:bg-[#f8f7fb]/60"
                    }`}
                  >
                    <div className="mb-3 flex w-full items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-900/40 text-purple-300">
                        <Moon size={18} />
                      </div>
                      {theme === "dark" && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#ffb3c3] text-[#2a234f]">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    {/* Mini Visual Preview Mockup */}
                    <div className="mb-3 h-16 w-full rounded-xl border border-[#2e265c] bg-[#0f0b21] p-2 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-12 rounded-full bg-white/70" />
                        <div className="h-2 w-4 rounded-full bg-[#ffb3c3]" />
                      </div>
                      <div className="h-3 w-16 rounded-full bg-white" />
                      <div className="h-1.5 w-full rounded-full bg-[#2e265c]" />
                    </div>

                    <p className="text-xs font-bold text-[#2a234f]">Dark Mode</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#77738a]">
                      Deep midnight navy surfaces with reduced eye strain and luminous highlights.
                    </p>
                  </button>

                  {/* Option 3: System Preference */}
                  <button
                    type="button"
                    onClick={() => setTheme("system")}
                    className={`group relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all duration-200 ${
                      theme === "system"
                        ? "border-[#2a234f] bg-[#ffb3c3]/15 ring-2 ring-[#2a234f]/20 shadow-sm"
                        : "border-[#e8e5ef] bg-white hover:border-[#2a234f]/40 hover:bg-[#f8f7fb]/60"
                    }`}
                  >
                    <div className="mb-3 flex w-full items-center justify-between">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-[#2a234f]">
                        <Laptop size={18} />
                      </div>
                      {theme === "system" && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2a234f] text-white">
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>

                    {/* Mini Visual Preview Mockup (Split) */}
                    <div className="mb-3 h-16 w-full rounded-xl border border-[#e8e5ef] bg-gradient-to-r from-[#f8f7fb] from-50% to-[#0f0b21] to-50% p-2 flex flex-col justify-between overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="h-2 w-10 rounded-full bg-[#2a234f]/80" />
                        <div className="h-2 w-4 rounded-full bg-[#ffb3c3]" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-3 w-8 rounded-full bg-[#2a234f]" />
                        <div className="h-3 w-8 rounded-full bg-white" />
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-[#e8e5ef] from-50% to-[#2e265c] to-50%" />
                    </div>

                    <p className="text-xs font-bold text-[#2a234f]">System Default</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#77738a]">
                      Automatically synchronizes with your device's daylight and night schedules.
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAMILY WORKSPACE (ONLY RENDERED FOR ADMINS) */}
          {activeTab === "family" && familyRole === "admin" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Family Space Name Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a234f] text-[#ffb3c3]">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f]">
                      Family Space Name
                    </h2>
                    <p className="text-xs text-[#77738a]">
                      The shared title visible to all connected family members.
                    </p>
                  </div>
                </div>

                {familySuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>{familySuccess}</span>
                  </div>
                )}

                {familyError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{familyError}</span>
                  </div>
                )}

                <form onSubmit={handleFamilyRename} className="mt-5 space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      Workspace Title
                    </label>
                    <input
                      type="text"
                      value={familyNameInput}
                      onChange={(e) => setFamilyNameInput(e.target.value)}
                      placeholder="e.g. Sharma Household"
                      className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 text-xs font-semibold text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingFamily}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#2a234f] px-5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isUpdatingFamily ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Workspace Name</span>
                    )}
                  </button>
                </form>
              </div>

              {/* Family Join Code Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3]/30 text-[#2a234f]">
                    <KeyRound size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f]">
                      Family Join Code
                    </h2>
                    <p className="text-xs text-[#77738a]">
                      Share this 6-character code with household members to join.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between rounded-2xl border border-[#e8e5ef] bg-[#f8f7fb] p-4">
                    <div>
                      <p className="text-[11px] font-semibold text-[#77738a] uppercase tracking-wider">
                        Active Access Code
                      </p>
                      <p className="font-mono text-2xl font-black tracking-widest text-[#2a234f]">
                        {familyCode || "------"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-[#e8e5ef] px-3.5 py-2 text-xs font-bold text-[#2a234f] shadow-xs transition hover:bg-[#f8f7fb] active:scale-95"
                    >
                      {codeCopied ? (
                        <>
                          <Check size={14} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-[#77738a] max-w-xs">
                      Need to invalidate previous access? Generate a new unique code anytime.
                    </p>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      disabled={isRegeneratingCode}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                    >
                      <RefreshCw size={13} className={isRegeneratingCode ? "animate-spin" : ""} />
                      <span>Regenerate</span>
                    </button>
                  </div>

                  <div className="mt-4 rounded-xl border border-dashed border-[#e8e5ef] bg-[#f8f7fb]/70 p-3.5 text-xs text-[#77738a] flex items-center justify-between">
                    <span>Manage family member permissions & roles:</span>
                    <Link
                      to="/family"
                      className="font-bold text-[#2a234f] underline hover:text-[#1f1a3b]"
                    >
                      Family Page →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM CATEGORIES (ONLY RENDERED FOR ADMINS & MEMBERS) */}
          {activeTab === "categories" && familyRole !== "viewer" && (
            <div className="space-y-6">
              {/* Add Category Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600">
                    <FolderPlus size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f]">
                      Create Custom Category
                    </h2>
                    <p className="text-xs text-[#77738a]">
                      Add specialized expense or income tags tailored to your family's lifestyle.
                    </p>
                  </div>
                </div>

                {categorySuccess && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800">
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                    <span>{categorySuccess}</span>
                  </div>
                )}

                {categoryError && (
                  <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                    <AlertCircle size={16} className="shrink-0 text-rose-600" />
                    <span>{categoryError}</span>
                  </div>
                )}

                <form onSubmit={handleCreateCategory} className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="e.g. Pet Care, Tuition, Freelance Client"
                      className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 text-xs font-semibold text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                    />
                  </div>

                  <div className="w-full sm:w-44">
                    <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                      Category Type
                    </label>
                    <div className="flex h-11 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] p-1">
                      <button
                        type="button"
                        onClick={() => setCategoryType("expense")}
                        className={`flex-1 rounded-lg text-xs font-bold transition ${
                          categoryType === "expense"
                            ? "bg-[#2a234f] text-white shadow-xs"
                            : "text-[#77738a] hover:text-[#2a234f]"
                        }`}
                      >
                        Expense
                      </button>
                      <button
                        type="button"
                        onClick={() => setCategoryType("income")}
                        className={`flex-1 rounded-lg text-xs font-bold transition ${
                          categoryType === "income"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-[#77738a] hover:text-[#2a234f]"
                        }`}
                      >
                        Income
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isAddingCategory || !categoryName.trim()}
                    className="h-11 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[#2a234f] px-6 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-[0.99] disabled:opacity-50"
                  >
                    {isAddingCategory ? (
                      <Loader2 size={15} className="animate-spin text-[#ffb3c3]" />
                    ) : (
                      <FolderPlus size={15} />
                    )}
                    <span>Add Category</span>
                  </button>
                </form>
              </div>

              {/* Category Lists Split */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Expense Categories */}
                <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#e8e5ef] pb-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-[#2a234f]">
                        Expense Categories
                      </h3>
                      <p className="text-xs text-[#77738a]">
                        Assigned to outgoing household transactions.
                      </p>
                    </div>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-700">
                      {expenseCategories.length} Categories
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {expenseCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="group inline-flex items-center gap-2 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] px-3 py-2 text-xs font-semibold text-[#2a234f] transition hover:border-[#ffb3c3] hover:bg-white"
                      >
                        <span>{cat.name}</span>
                        {familyRole === "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={deletingCategoryId === cat.id}
                            title="Delete category"
                            className="text-[#9a96a8] hover:text-rose-600 transition"
                          >
                            {deletingCategoryId === cat.id ? (
                              <Loader2 size={13} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Income Categories */}
                <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-[#e8e5ef] pb-3.5">
                    <div>
                      <h3 className="text-sm font-bold text-[#2a234f]">
                        Income Categories
                      </h3>
                      <p className="text-xs text-[#77738a]">
                        Assigned to incoming salaries and earnings.
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                      {incomeCategories.length} Categories
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {incomeCategories.map((cat) => (
                      <div
                        key={cat.id}
                        className="group inline-flex items-center gap-2 rounded-xl border border-[#e8e5ef] bg-[#f8f7fb] px-3 py-2 text-xs font-semibold text-[#2a234f] transition hover:border-emerald-300 hover:bg-white"
                      >
                        <span>{cat.name}</span>
                        {familyRole === "admin" && (
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(cat)}
                            disabled={deletingCategoryId === cat.id}
                            title="Delete category"
                            className="text-[#9a96a8] hover:text-rose-600 transition"
                          >
                            {deletingCategoryId === cat.id ? (
                              <Loader2 size={13} className="animate-spin text-rose-600" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI & DATA PREFERENCES (Visible to all) */}
          {activeTab === "data" && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* AI Conversation & History Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm dark:border-[#2e265c] dark:bg-[#161130]">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4 dark:border-[#2e265c]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/15 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
                    <RotateCcw size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                      AI Chat History
                    </h2>
                    <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                      Manage saved chat continuity for the financial assistant.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <p className="text-xs text-[#77738a] leading-relaxed dark:text-[#a5a0ba]">
                    Your conversation with the AI Financial Assistant is stored for your active session continuity. You can clear this session history at any time.
                  </p>

                  {chatCleared && (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-400">
                      <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>Chat conversation history cleared.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleClearChat}
                    className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5ef] bg-white px-4 py-2 text-xs font-bold text-[#2a234f] shadow-xs transition hover:bg-[#f8f7fb] active:scale-95 dark:border-[#2e265c] dark:bg-[#1c1540] dark:text-[#f5f3fa] dark:hover:bg-[#251d54]"
                  >
                    <RotateCcw size={14} />
                    <span>Clear Chat History</span>
                  </button>
                </div>
              </div>

              {/* Data Export Card */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-white p-6 shadow-sm dark:border-[#2e265c] dark:bg-[#161130]">
                <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4 dark:border-[#2e265c]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                    <Download size={20} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#2a234f] dark:text-[#f5f3fa]">
                      Export Family Data
                    </h2>
                    <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                      Download transaction records for spreadsheets or accounting.
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  <p className="text-xs text-[#77738a] leading-relaxed dark:text-[#a5a0ba]">
                    Export all non-deleted family transactions including amounts, categories, assigned members, and dates formatted as a standard RFC-4180 CSV file compatible with Excel and Google Sheets.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsExportModalOpen(true)}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-95 dark:bg-[#352a6a] dark:hover:bg-[#433585]"
                    >
                      <Download size={14} className="text-[#ffb3c3]" />
                      <span>Custom Report & Statement (PDF / Excel / CSV)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      disabled={isExportingCSV}
                      className="inline-flex items-center gap-2 rounded-xl border border-[#e8e5ef] bg-white px-4 py-2.5 text-xs font-bold text-[#2a234f] shadow-xs transition hover:bg-[#f8f7fb] active:scale-95 disabled:opacity-50 dark:border-[#2e265c] dark:bg-[#1c1540] dark:text-[#f5f3fa] dark:hover:bg-[#251d54]"
                    >
                      {isExportingCSV ? (
                        <>
                          <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                          <span>Exporting CSV...</span>
                        </>
                      ) : (
                        <span>Quick CSV Dump</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: REVEAL EMAIL PASSWORD CONFIRMATION */}
      {/* ========================================================================= */}
      {isRevealModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17132f]/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#e8e5ef] bg-white p-6 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => {
                setIsRevealModalOpen(false);
                setRevealError(null);
                setRevealPassword("");
              }}
              className="absolute right-5 top-5 text-[#77738a] hover:text-[#2a234f]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#ffb3c3]/30 text-[#2a234f]">
                <KeyRound size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2a234f]">
                  Verify Password to Reveal Email
                </h3>
                <p className="text-xs text-[#77738a]">
                  Confirm your identity to display your full account email.
                </p>
              </div>
            </div>

            {revealError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{revealError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyPasswordToReveal} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                  Account Password
                </label>
                <div className="relative">
                  <input
                    type={showRevealPassword ? "text" : "password"}
                    value={revealPassword}
                    onChange={(e) => setRevealPassword(e.target.value)}
                    autoFocus
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 pr-10 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRevealPassword(!showRevealPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77738a] hover:text-[#2a234f]"
                  >
                    {showRevealPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRevealModalOpen(false);
                    setRevealError(null);
                    setRevealPassword("");
                  }}
                  className="rounded-xl border border-[#e8e5ef] px-4 py-2.5 text-xs font-bold text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingReveal || !revealPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-95 disabled:opacity-50"
                >
                  {isVerifyingReveal ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Confirm & Reveal</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: 2FA SETUP ACTIVATION */}
      {/* ========================================================================= */}
      {isSetupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17132f]/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg rounded-3xl border border-[#e8e5ef] bg-white p-6 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => {
                setIsSetupModalOpen(false);
                setSetupError(null);
                setTotpCodeInput("");
              }}
              className="absolute right-5 top-5 text-[#77738a] hover:text-[#2a234f]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2a234f] to-[#1f1a3b] text-[#ffb3c3]">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2a234f]">
                  Set Up Two-Factor Authentication
                </h3>
                <p className="text-xs text-[#77738a]">
                  Link an authenticator app using standard TOTP protocol.
                </p>
              </div>
            </div>

            {setupError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{setupError}</span>
              </div>
            )}

            <div className="mt-5 space-y-4 text-xs">
              {/* Step 1: Scan QR Code or enter manual key */}
              <div className="rounded-2xl border border-[#e8e5ef] bg-[#f8f7fb] p-5">
                <p className="font-bold text-[#2a234f] text-sm mb-1">
                  Step 1: Scan QR Code with your Authenticator App
                </p>
                <p className="text-[#77738a] leading-relaxed mb-4 text-xs">
                  Open Google Authenticator, Microsoft Authenticator, Authy, or Apple Passwords on your mobile device and scan this QR code:
                </p>

                {/* QR Code Presentation Card */}
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e8e5ef] bg-white p-4 shadow-xs mb-4">
                  {totpQrCode ? (
                    <img
                      src={totpQrCode}
                      alt="Two-Factor Authentication QR Code"
                      className="h-44 w-44 rounded-xl border border-[#f0edf7] p-1.5"
                    />
                  ) : (
                    <div className="flex h-44 w-44 items-center justify-center">
                      <Loader2 size={24} className="animate-spin text-[#2a234f]" />
                    </div>
                  )}
                  <p className="mt-2 text-[11px] font-semibold text-[#77738a]">
                    Point your device camera or app scanner at this code
                  </p>
                </div>

                {/* Manual Setup Key Alternative */}
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-[#77738a]">
                    Can't scan? Enter setup key manually:
                  </p>
                  <div className="flex items-center justify-between rounded-xl border border-[#e8e5ef] bg-white px-3 py-2">
                    <span className="font-mono text-xs font-black tracking-widest text-[#2a234f] select-all break-all">
                      {totpSecret || "----------------"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="ml-2 shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#f8f7fb] px-2.5 py-1.5 text-[11px] font-bold text-[#2a234f] hover:bg-[#e8e5ef] transition"
                    >
                      {copiedSecret ? (
                        <>
                          <Check size={13} className="text-emerald-600" />
                          <span className="text-emerald-600">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy Key</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 2: Verification Code Input */}
              <form onSubmit={handleConfirmEnable2FA} className="space-y-4">
                <div>
                  <label className="mb-1 block font-bold text-[#2a234f]">
                    Step 2: Enter the 6-digit confirmation code
                  </label>
                  <p className="text-[#77738a] text-[11px] mb-2">
                    Enter the current code generated by your app to verify synchronization.
                  </p>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpCodeInput}
                    onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="h-12 w-full rounded-xl border border-[#e8e5ef] bg-white px-4 text-center font-mono text-xl font-bold tracking-widest text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSetupModalOpen(false);
                      setSetupError(null);
                      setTotpCodeInput("");
                    }}
                    className="rounded-xl border border-[#e8e5ef] px-4 py-2.5 text-xs font-bold text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f] transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isEnabling2FA || totpCodeInput.length !== 6}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2a234f] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f1a3b] active:scale-95 disabled:opacity-50"
                  >
                    {isEnabling2FA ? (
                      <>
                        <Loader2 size={14} className="animate-spin text-[#ffb3c3]" />
                        <span>Activating...</span>
                      </>
                    ) : (
                      <span>Verify & Enable 2FA</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DISABLE 2FA CONFIRMATION */}
      {/* ========================================================================= */}
      {isDisableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17132f]/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-[#e8e5ef] bg-white p-6 shadow-2xl sm:p-7">
            <button
              type="button"
              onClick={() => {
                setIsDisableModalOpen(false);
                setDisableError(null);
                setDisablePasswordInput("");
              }}
              className="absolute right-5 top-5 text-[#77738a] hover:text-[#2a234f]"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 border-b border-[#e8e5ef] pb-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-200">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#2a234f]">
                  Disable Two-Factor Authentication
                </h3>
                <p className="text-xs text-[#77738a]">
                  Confirm with your account password to remove 2FA.
                </p>
              </div>
            </div>

            {disableError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-800">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{disableError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDisable2FA} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#77738a]">
                  Current Account Password
                </label>
                <div className="relative">
                  <input
                    type={showDisablePassword ? "text" : "password"}
                    value={disablePasswordInput}
                    onChange={(e) => setDisablePasswordInput(e.target.value)}
                    autoFocus
                    placeholder="Enter your password"
                    className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white px-3.5 pr-10 text-xs text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDisablePassword(!showDisablePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#77738a] hover:text-[#2a234f]"
                  >
                    {showDisablePassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDisableModalOpen(false);
                    setDisableError(null);
                    setDisablePasswordInput("");
                  }}
                  className="rounded-xl border border-[#e8e5ef] px-4 py-2.5 text-xs font-bold text-[#77738a] hover:bg-[#f8f7fb] hover:text-[#2a234f] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDisabling2FA || !disablePasswordInput}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 active:scale-95 disabled:opacity-50"
                >
                  {isDisabling2FA ? (
                    <>
                      <Loader2 size={14} className="animate-spin text-white" />
                      <span>Disabling...</span>
                    </>
                  ) : (
                    <span>Disable 2FA</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Export Reports Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        categories={categories}
        members={members}
      />
    </div>
  );
}

export default Settings;
