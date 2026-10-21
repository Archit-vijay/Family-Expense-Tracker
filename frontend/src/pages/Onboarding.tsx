import {
  ArrowRight,
  CheckCircle2,
  Home,
  KeyRound,
  Loader2,
  LogOut,
  Sparkles,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { createFamily, joinFamily } from "../services/familyService";

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, hasFamily, refreshFamily, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<"create" | "join">("create");
  const [familyName, setFamilyName] = useState("");
  const [familyCode, setFamilyCode] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // If user already has a family, redirect directly to dashboard
  if (hasFamily === true) {
    return <Navigate to="/dashboard" replace />;
  }

  async function handleCreateFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!familyName.trim()) {
      setError("Please provide a name for your family group.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await createFamily(familyName.trim());
      await refreshFamily();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to create family space.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleJoinFamily(e: React.FormEvent) {
    e.preventDefault();
    if (!familyCode.trim()) {
      setError("Please enter the 6-character family code.");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await joinFamily(familyCode.trim().toUpperCase());
      await refreshFamily();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Failed to join family.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#f4f1fa] via-[#f8f7fb] to-[#ffffff] text-[#2a234f] flex flex-col justify-between overflow-x-hidden">
      {/* Ambient background blur circles */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#ffb3c3]/20 blur-3xl" />
        <div className="absolute top-1/3 -left-20 h-80 w-80 rounded-full bg-[#2a234f]/5 blur-3xl" />
        <div className="absolute bottom-10 -right-20 h-96 w-96 rounded-full bg-[#ffb3c3]/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-[#e8e5ef]/80 bg-white/70 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a234f] text-base font-bold text-[#ffb3c3] shadow-md shadow-[#2a234f]/15">
              ₹
            </div>
            <div>
              <h1 className="text-base font-bold text-[#2a234f]">
                Family Finance
              </h1>
              <p className="text-xs text-[#77738a]">
                Welcome, {user?.name || "Friend"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8e5ef] bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-[#77738a] shadow-xs transition hover:bg-white hover:text-[#2a234f] hover:-translate-y-0.5 active:translate-y-0"
          >
            <LogOut size={14} />
            <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-12">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#ffb3c3]/50 bg-[#ffb3c3]/20 px-3.5 py-1 text-xs font-bold text-[#2a234f] shadow-xs">
            <Sparkles size={13} className="text-[#2a234f]" />
            Getting Started
          </span>
          <h2 className="mt-3.5 text-3xl font-extrabold tracking-tight sm:text-4xl text-[#2a234f]">
            Connect your family space
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#77738a]">
            Establish a brand-new shared financial space or enter your household's access code to join an existing family.
          </p>
        </div>

        {/* Animated switch tab pill */}
        <div className="mx-auto mb-8 flex max-w-sm rounded-2xl border border-[#e8e5ef] bg-white/90 p-1.5 shadow-md shadow-[#2a234f]/5 backdrop-blur-md">
          <button
            type="button"
            onClick={() => {
              setActiveTab("create");
              setError(null);
            }}
            className={`group relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 transform active:scale-95 ${
              activeTab === "create"
                ? "bg-[#2a234f] text-white shadow-md shadow-[#2a234f]/25 scale-[1.02]"
                : "text-[#77738a] hover:text-[#2a234f] hover:bg-black/5 hover:-translate-y-0.5"
            }`}
          >
            <Home
              size={15}
              className={`transition-transform duration-300 ${
                activeTab === "create" ? "scale-110 text-[#ffb3c3]" : "group-hover:scale-110"
              }`}
            />
            <span>Create New Family</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("join");
              setError(null);
            }}
            className={`group relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all duration-300 transform active:scale-95 ${
              activeTab === "join"
                ? "bg-[#2a234f] text-white shadow-md shadow-[#2a234f]/25 scale-[1.02]"
                : "text-[#77738a] hover:text-[#2a234f] hover:bg-black/5 hover:-translate-y-0.5"
            }`}
          >
            <KeyRound
              size={15}
              className={`transition-transform duration-300 ${
                activeTab === "join" ? "scale-110 text-[#ffb3c3]" : "group-hover:scale-110"
              }`}
            />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mx-auto mb-6 max-w-md rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-xs font-medium text-rose-700 shadow-sm animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Card composition */}
        <div className="mx-auto w-full max-w-md">
          {activeTab === "create" ? (
            <div className="rounded-[28px] border border-[#e8e5ef] bg-white/95 p-7 shadow-xl shadow-[#2a234f]/8 sm:p-9 backdrop-blur-xl transition-all duration-300 animate-in fade-in-50 zoom-in-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ffb3c3]/30 to-[#ffb3c3]/10 text-[#2a234f] shadow-xs">
                <Home size={24} />
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-[#2a234f]">
                Establish a New Family Space
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#77738a]">
                You'll be the primary family administrator. You can invite household members, configure custom budgets, and track shared wealth.
              </p>

              <form onSubmit={handleCreateFamily} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="familyName"
                    className="mb-1.5 block text-xs font-semibold text-[#77738a]"
                  >
                    Family or Household Name
                  </label>
                  <input
                    id="familyName"
                    type="text"
                    value={familyName}
                    onChange={(e) => setFamilyName(e.target.value)}
                    placeholder="e.g. The Sharma Family"
                    className="h-12 w-full rounded-xl border border-[#e8e5ef] bg-white px-4 text-sm text-[#2a234f] outline-none transition-all duration-200 placeholder:text-[#9a96a8] focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                </div>

                <div className="rounded-2xl border border-[#e8e5ef]/70 bg-[#f8f7fb] p-3.5 text-xs text-[#77738a] space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-[#2a234f]">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Includes standard expense & income starter categories</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-[#2a234f]">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Generates a unique 6-character code you can share</span>
                  </div>
                </div>

                {/* Animated Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2a234f] text-sm font-semibold text-white shadow-lg shadow-[#2a234f]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1f1a3b] hover:shadow-xl hover:shadow-[#2a234f]/30 active:translate-y-0 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#ffb3c3]" />
                      <span>Creating workspace...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Family Space</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1.5 text-[#ffb3c3]"
                      />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-[28px] border border-[#e8e5ef] bg-white/95 p-7 shadow-xl shadow-[#2a234f]/8 sm:p-9 backdrop-blur-xl transition-all duration-300 animate-in fade-in-50 zoom-in-95">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2a234f] text-[#ffb3c3] shadow-md shadow-[#2a234f]/20">
                <KeyRound size={24} />
              </div>

              <h3 className="mt-5 text-xl font-bold tracking-tight text-[#2a234f]">
                Join an Existing Family
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-[#77738a]">
                Ask your family administrator for their 6-character Family Join Code to connect to your household workspace.
              </p>

              <form onSubmit={handleJoinFamily} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="familyCode"
                    className="mb-1.5 block text-xs font-semibold text-[#77738a]"
                  >
                    Enter 6-Character Family Code
                  </label>
                  <input
                    id="familyCode"
                    type="text"
                    maxLength={10}
                    value={familyCode}
                    onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
                    placeholder="e.g. K92X4P"
                    className="h-13 w-full text-center font-mono text-xl font-extrabold tracking-[0.25em] uppercase rounded-xl border border-[#e8e5ef] bg-white px-4 text-[#2a234f] outline-none transition-all duration-200 placeholder:text-[#9a96a8] focus:border-[#ffb3c3] focus:ring-4 focus:ring-[#ffb3c3]/20"
                  />
                </div>

                <div className="rounded-2xl border border-[#e8e5ef]/70 bg-[#f8f7fb] p-3.5 text-xs text-[#77738a] space-y-1.5">
                  <div className="flex items-center gap-2 font-medium text-[#2a234f]">
                    <Users size={14} className="text-[#2a234f] shrink-0" />
                    <span>You will join with member permissions to record transactions</span>
                  </div>
                  <div className="flex items-center gap-2 font-medium text-[#2a234f]">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span>Immediate access to family budgets and AI insights</span>
                  </div>
                </div>

                {/* Animated Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#2a234f] text-sm font-semibold text-white shadow-lg shadow-[#2a234f]/20 transition-all duration-300 hover:-translate-y-1 hover:bg-[#1f1a3b] hover:shadow-xl hover:shadow-[#2a234f]/30 active:translate-y-0 active:scale-[0.99] disabled:opacity-60"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-[#ffb3c3]" />
                      <span>Joining family...</span>
                    </>
                  ) : (
                    <>
                      <span>Join Family Space</span>
                      <ArrowRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-1.5 text-[#ffb3c3]"
                      />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#e8e5ef]/80 bg-white/70 backdrop-blur-md px-6 py-4 text-center text-xs text-[#77738a]">
        © 2026 Family Finance · Shared wealth management made simple.
      </footer>
    </div>
  );
}
