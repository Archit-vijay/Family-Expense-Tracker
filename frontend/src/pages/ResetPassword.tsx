import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import { resetPassword, verifyResetToken } from "../services/authService";

function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [requires2FA, setRequires2FA] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!token) {
        setIsVerifying(false);
        setTokenValid(false);
        setTokenError("No reset token provided. Please request a new password reset link.");
        return;
      }

      try {
        setIsVerifying(true);
        const result = await verifyResetToken(token);
        if (!isMounted) return;

        if (result.valid) {
          setTokenValid(true);
          setAccountEmail(result.email || "");
          setRequires2FA(Boolean(result.requires2FA));
        } else {
          setTokenValid(false);
          setTokenError(result.message || "This password reset link is invalid or has expired.");
        }
      } catch (err: any) {
        if (!isMounted) return;
        setTokenValid(false);
        setTokenError(err.message || "Unable to verify password reset token.");
      } finally {
        if (isMounted) setIsVerifying(false);
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [token]);

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score <= 3) return { score: 2, label: "Medium", color: "bg-amber-500" };
    return { score: 3, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!newPassword) {
      setFormError("Please enter your new password.");
      return;
    }

    if (newPassword.length < 6) {
      setFormError("Password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    if (requires2FA && (!twoFactorCode || twoFactorCode.trim().length !== 6)) {
      setFormError("Please enter your 6-digit two-factor authentication code.");
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError("");

      await resetPassword({
        token,
        newPassword,
        twoFactorCode: requires2FA ? twoFactorCode.trim() : undefined,
      });

      setIsSuccess(true);
    } catch (err: any) {
      setFormError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes resetGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          .reset-gradient {
            background: linear-gradient(135deg, #17132f 0%, #2a234f 32%, #443862 58%, #7a5d78 78%, #ffb3c3 100%);
            background-size: 200% 200%;
            animation: resetGradient 20s ease-in-out infinite;
          }
          html.dark .reset-gradient {
            background: linear-gradient(135deg, #0b071a 0%, #120d28 32%, #191238 58%, #231742 78%, #321a48 100%);
            background-size: 200% 200%;
          }
        `}
      </style>

      <div className="reset-gradient relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#ffb3c3] selection:text-[#2a234f]">
        {/* Decorative ambient background blurs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#ffb3c3]/15 blur-3xl" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-[#2a234f]/40 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          {/* Logo / Brand header */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-[#ffb3c3] shadow-lg">
              <KeyRound size={22} />
            </div>
            <div className="text-left">
              <span className="block text-xl font-bold tracking-tight text-white">Family Finance</span>
              <span className="block text-xs font-medium text-white/60 tracking-wider uppercase">Account Security</span>
            </div>
          </div>

          {/* Main Card */}
          <div className="rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl backdrop-blur-xl sm:p-8 dark:border-[#2e265c] dark:bg-[#161130]/95">
            {isVerifying ? (
              <div className="py-12 text-center">
                <Loader2 size={36} className="mx-auto animate-spin text-[#2a234f] dark:text-[#ffb3c3]" />
                <p className="mt-4 text-sm font-semibold text-[#2a234f] dark:text-white">Verifying reset token...</p>
                <p className="mt-1 text-xs text-[#77738a] dark:text-[#a5a0ba]">Validating your single-use recovery link</p>
              </div>
            ) : !tokenValid ? (
              /* Invalid or expired token view */
              <div className="text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300">
                  <ShieldAlert size={28} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-[#2a234f] dark:text-white">Invalid or Expired Link</h2>
                <p className="mt-2 text-xs leading-relaxed text-[#77738a] dark:text-[#a5a0ba]">
                  {tokenError || "This password reset link is invalid, has expired, or has already been used."}
                </p>

                <div className="mt-6 flex flex-col gap-2.5">
                  <Link
                    to="/login"
                    className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2a234f] text-sm font-semibold tracking-wide text-white transition hover:bg-[#1f1a3b] dark:border dark:border-[#4d4090]/80 dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e] dark:text-[#f5f3fa] dark:hover:border-[#ffb3c3]/40"
                  >
                    <span>Return to Login</span>
                    <ArrowRight size={16} className="text-[#ffb3c3] transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ) : isSuccess ? (
              /* Success confirmation view */
              <div className="text-center py-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300">
                  <CheckCircle2 size={30} />
                </div>
                <h2 className="mt-4 text-xl font-bold text-[#2a234f] dark:text-white">Password Reset Complete</h2>
                <p className="mt-2 text-xs leading-relaxed text-[#77738a] dark:text-[#a5a0ba]">
                  Your password has been successfully updated. You can now sign in to Family Finance using your new credentials.
                </p>

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => navigate(`/login?reset=success&email=${encodeURIComponent(accountEmail)}`)}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2a234f] text-sm font-semibold tracking-wide text-white transition hover:bg-[#1f1a3b] dark:border dark:border-[#4d4090]/80 dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e] dark:text-[#f5f3fa] dark:hover:border-[#ffb3c3]/40"
                  >
                    <span>Sign In Now</span>
                    <ArrowRight size={16} className="text-[#ffb3c3] transition-transform duration-200 group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            ) : (
              /* Active password reset form */
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-[#2a234f] dark:text-white">Reset Password</h2>
                  <p className="mt-1 text-xs text-[#77738a] dark:text-[#a5a0ba]">
                    Create a new, strong password for <span className="font-semibold text-[#2a234f] dark:text-white">{accountEmail}</span>
                  </p>
                </div>

                {formError && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-300">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#77738a] dark:text-[#c4c1d6]">
                      New Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#77738a]">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white pl-10 pr-10 text-sm text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20 dark:border-[#2e265c] dark:bg-[#110c26] dark:text-[#f5f3fa]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#77738a] hover:text-[#2a234f] dark:hover:text-white"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {newPassword && (
                      <div className="mt-2 space-y-1">
                        <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-slate-100 dark:bg-[#251d45]">
                          <div className={`h-full flex-1 rounded-full ${strength.score >= 1 ? strength.color : "opacity-20"}`} />
                          <div className={`h-full flex-1 rounded-full ${strength.score >= 2 ? strength.color : "opacity-20"}`} />
                          <div className={`h-full flex-1 rounded-full ${strength.score >= 3 ? strength.color : "opacity-20"}`} />
                        </div>
                        <p className="text-[11px] text-right font-medium text-[#77738a] dark:text-[#a5a0ba]">
                          Strength: <span className="font-semibold text-[#2a234f] dark:text-white">{strength.label}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[#77738a] dark:text-[#c4c1d6]">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#77738a]">
                        <Lock size={16} />
                      </div>
                      <input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11 w-full rounded-xl border border-[#e8e5ef] bg-white pl-10 pr-10 text-sm text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20 dark:border-[#2e265c] dark:bg-[#110c26] dark:text-[#f5f3fa]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#77738a] hover:text-[#2a234f] dark:hover:text-white"
                      >
                        {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="mt-1 text-[11px] text-rose-500 font-medium">Passwords do not match</p>
                    )}
                  </div>

                  {/* 2FA Verification (if account has 2FA enabled) */}
                  {requires2FA && (
                    <div className="rounded-2xl border border-[#e8e5ef] bg-[#f8f7fb] p-3.5 dark:border-[#2e265c] dark:bg-[#120d28]">
                      <div className="mb-2 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-[#2a234f] dark:text-[#ffb3c3]" />
                        <label className="text-xs font-bold text-[#2a234f] dark:text-white">
                          Two-Factor Authentication Code
                        </label>
                      </div>
                      <p className="mb-2 text-[11px] text-[#77738a] dark:text-[#a5a0ba]">
                        Enter the current 6-digit code from your authenticator app to authorize this reset.
                      </p>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={twoFactorCode}
                        onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="000000"
                        required
                        className="h-11 w-full text-center text-lg font-mono tracking-widest rounded-xl border border-[#e8e5ef] bg-white text-[#2a234f] outline-none transition focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20 dark:border-[#2e265c] dark:bg-[#110c26] dark:text-[#f5f3fa]"
                      />
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !newPassword || newPassword !== confirmPassword}
                    className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2a234f] text-sm font-semibold tracking-wide text-white shadow-md shadow-[#2a234f]/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#1f1a3b] hover:shadow-lg active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 dark:border dark:border-[#4d4090]/80 dark:bg-gradient-to-r dark:from-[#2a234f] dark:to-[#382e6e] dark:text-[#f5f3fa] dark:shadow-black/50 dark:hover:from-[#332b5f] dark:hover:to-[#433785] dark:hover:border-[#ffb3c3]/40"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-[#ffb3c3]" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password</span>
                        <ArrowRight size={16} className="text-[#ffb3c3] transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-2">
                    <Link
                      to="/login"
                      className="text-xs font-medium text-[#77738a] hover:text-[#2a234f] dark:text-[#a5a0ba] dark:hover:text-white transition-colors"
                    >
                      Remember your password? Sign in
                    </Link>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default ResetPassword;
