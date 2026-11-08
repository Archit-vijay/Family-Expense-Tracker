import { Link } from "react-router-dom";
import { Compass, Home, LayoutDashboard, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function NotFound() {
  const { user } = useAuth();

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#F8F7FB] dark:bg-[#0e0a1f] px-6 py-12 transition-colors duration-200">
      {/* Decorative ambient background glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gradient-to-tr from-[#2A234F]/10 via-[#FFB3C3]/15 to-transparent blur-3xl dark:from-[#2A234F]/30 dark:via-[#FFB3C3]/10" />
      </div>

      <div className="relative z-10 mx-auto max-w-lg text-center animate-fade-in">
        {/* Stylized 404 Emblem */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white shadow-xl shadow-[#2A234F]/5 border border-[#E8E5EF] dark:bg-[#1a143b] dark:border-[#2e265c] dark:shadow-black/20">
          <Compass className="h-10 w-10 text-[#2A234F] dark:text-[#FFB3C3] animate-pulse" />
        </div>

        {/* Status Pill */}
        <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-[#2A234F]/10 bg-white/80 px-4 py-1 text-xs font-bold tracking-wider uppercase text-[#2A234F] shadow-xs backdrop-blur-md dark:border-[#FFB3C3]/20 dark:bg-[#1a143b]/80 dark:text-[#FFB3C3]">
          Error 404 · Page Not Found
        </div>

        {/* Heading */}
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-[#2A234F] sm:text-4xl dark:text-white">
          Off the financial ledger.
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm leading-relaxed text-[#77738A] sm:text-base dark:text-[#a09cb4]">
          The page you requested does not exist, has been moved, or the link may be out of date. Check the URL or return to your financial space.
        </p>

        {/* Actions */}
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {user ? (
            <Link
              to="/dashboard"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#2A234F] px-6 text-sm font-semibold text-white shadow-md shadow-[#2A234F]/20 transition-all duration-200 hover:bg-[#1F1A3B] hover:-translate-y-0.5 active:translate-y-0 dark:bg-[#FFB3C3] dark:text-[#2A234F] dark:shadow-none dark:hover:bg-[#FF9FB4]"
            >
              <LayoutDashboard size={16} />
              <span>Go to Dashboard</span>
            </Link>
          ) : (
            <Link
              to="/login"
              className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-[#2A234F] px-6 text-sm font-semibold text-white shadow-md shadow-[#2A234F]/20 transition-all duration-200 hover:bg-[#1F1A3B] hover:-translate-y-0.5 active:translate-y-0 dark:bg-[#FFB3C3] dark:text-[#2A234F] dark:shadow-none dark:hover:bg-[#FF9FB4]"
            >
              <span>Sign In to Space</span>
            </Link>
          )}

          <Link
            to="/"
            className="inline-flex h-11 w-full sm:w-auto items-center justify-center gap-2 rounded-xl border border-[#E8E5EF] bg-white px-5 text-sm font-semibold text-[#2A234F] shadow-xs transition-all duration-200 hover:bg-[#F8F7FB] hover:border-[#d6d2e1] active:scale-[0.99] dark:border-[#2e265c] dark:bg-[#161130] dark:text-[#f5f3fa] dark:hover:bg-[#1f1842]"
          >
            <Home size={16} />
            <span>Return to Home</span>
          </Link>
        </div>

        {/* Footer Back link */}
        <div className="mt-10">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#77738A] hover:text-[#2A234F] dark:text-[#8d88a5] dark:hover:text-[#FFB3C3] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Go back to previous page</span>
          </button>
        </div>
      </div>
    </div>
  );
}
