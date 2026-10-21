import {
  ArrowRight,
  Bot,
  Cpu,
  KeyRound,
  Lock,
  Menu,
  PieChart,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import GoogleSignInButton from "../components/GoogleSignInButton";
import InteractiveRupeeCanvas from "../components/InteractiveRupeeCanvas";
import { useAuth } from "../context/AuthContext";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, hasFamily } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#100c22] text-white selection:bg-[#ffb3c3] selection:text-[#2a234f]">
      {/* Background radial glows */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-[20%] left-1/2 h-[750px] w-[750px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#2a234f]/50 via-[#443862]/20 to-transparent blur-3xl" />
        <div className="absolute top-[35%] -left-[15%] h-[500px] w-[500px] rounded-full bg-[#ffb3c3]/5 blur-[120px]" />
        <div className="absolute top-[65%] -right-[15%] h-[600px] w-[600px] rounded-full bg-[#2a234f]/40 blur-[140px]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#100c22]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3] text-lg font-bold text-[#2a234f] shadow-lg shadow-[#ffb3c3]/20 transition group-hover:scale-105">
              ₹
            </div>
            <div>
              <p className="text-base font-bold tracking-tight text-white">
                Family Finance
              </p>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-[#ffb3c3]/80">
                Shared Wealth Intelligence
              </p>
            </div>
          </Link>

          {/* Desktop Links (All 4 connect smoothly to dedicated page sections) */}
          <nav className="hidden items-center gap-8 md:flex text-xs font-semibold uppercase tracking-wider text-white/70">
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#ai-intelligence" className="transition hover:text-[#ffb3c3]">
              AI Intelligence
            </a>
            <a href="#family-code" className="transition hover:text-white">
              Family Codes
            </a>
            <a href="#security" className="transition hover:text-white">
              Privacy & Security
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden items-center gap-3 sm:flex">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => navigate(hasFamily ? "/dashboard" : "/onboarding")}
                className="inline-flex items-center gap-2 rounded-xl bg-[#ffb3c3] px-4 py-2 text-xs font-bold text-[#2a234f] shadow-md shadow-[#ffb3c3]/20 transition hover:bg-[#ff9fb4]"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={14} />
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
                >
                  Log In
                </Link>

                <Link
                  to="/signup"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#ffb3c3] px-4 py-2 text-xs font-bold text-[#2a234f] shadow-md shadow-[#ffb3c3]/20 transition hover:bg-[#ff9fb4] hover:-translate-y-0.5 active:translate-y-0"
                >
                  <span>Sign Up Free</span>
                  <ArrowRight size={13} />
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown drawer */}
        {mobileMenuOpen && (
          <div className="border-b border-white/10 bg-[#17132f] px-6 py-5 md:hidden space-y-4">
            <nav className="flex flex-col gap-3 text-sm font-medium text-white/80">
              <a
                href="#features"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#ffb3c3]"
              >
                Features
              </a>
              <a
                href="#ai-intelligence"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#ffb3c3]"
              >
                AI Financial Radar
              </a>
              <a
                href="#family-code"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#ffb3c3]"
              >
                Family Join Code
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="py-1 hover:text-[#ffb3c3]"
              >
                Privacy & Security
              </a>
            </nav>

            <div className="flex flex-col gap-2.5 pt-3 border-t border-white/10">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(hasFamily ? "/dashboard" : "/onboarding");
                  }}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffb3c3] font-bold text-xs text-[#2a234f]"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight size={14} />
                </button>
              ) : (
                <>
                  <Link
                    to="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ffb3c3] font-bold text-xs text-[#2a234f]"
                  >
                    <span>Sign Up Free</span>
                    <ArrowRight size={14} />
                  </Link>

                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex h-11 w-full items-center justify-center rounded-xl border border-white/20 bg-white/5 font-semibold text-xs text-white"
                  >
                    Log In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Hero Section */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-20 sm:px-8 lg:pt-20 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
          {/* Left Column: Headline, pitch, CTAs */}
          <div className="max-w-2xl">
            {/* Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb3c3]/30 bg-[#ffb3c3]/10 px-3.5 py-1.5 text-xs font-semibold text-[#ffb3c3] backdrop-blur-md">
              <Sparkles size={14} className="text-[#ffb3c3]" />
              <span>Next-Gen Family Financial Operating System</span>
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-extrabold tracking-[-0.04em] text-white sm:text-6xl lg:text-[68px] lg:leading-[1.05]">
              Shared wealth <br />
              <span className="bg-gradient-to-r from-white via-[#f8f7fb] to-[#ffb3c3] bg-clip-text text-transparent">
                intelligence.
              </span>
              <br />
              Built for families.
            </h1>

            <p className="mt-6 text-base leading-relaxed text-white/70 sm:text-lg">
              Manage expenses across household members, monitor real-time spending velocity with AI risk radar, and collaborate seamlessly using shareable 6-character family codes.
            </p>

            {/* Action buttons */}
            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <Link
                to="/signup"
                className="inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-[#ffb3c3] px-6 text-sm font-bold text-[#2a234f] shadow-xl shadow-[#ffb3c3]/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff9fb4] hover:shadow-2xl hover:shadow-[#ffb3c3]/30 active:translate-y-0"
              >
                <span>Create Family Space</span>
                <ArrowRight size={16} />
              </Link>

              <GoogleSignInButton text="Sign in with Google" />
            </div>

            {/* Supporting Micro-Highlights */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
              <div>
                <p className="text-xl font-extrabold text-white sm:text-2xl">100%</p>
                <p className="mt-0.5 text-xs text-white/50">Private Household Scoped</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-[#ffb3c3] sm:text-2xl">8 AI Tools</p>
                <p className="mt-0.5 text-xs text-white/50">Local Predictive Radars</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-white sm:text-2xl">Instant</p>
                <p className="mt-0.5 text-xs text-white/50">Direct Code Join</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive 3D Rupee Symbol on Desktop / Dynamic Card Array on Mobile */}
          <div className="relative flex items-center justify-center min-h-[420px] sm:min-h-[500px]">
            {!isMobile ? (
              /* Desktop: Interactive 3D Solid Rupee (₹) Symbol with Smooth Cursor Movement */
              <div className="relative h-[490px] w-full max-w-[520px]">
                <InteractiveRupeeCanvas className="h-full w-full" />
              </div>
            ) : (
              /* Mobile: Dedicated Touch-Native Visual Layout */
              <div className="w-full space-y-4">
                {/* Visual 3D Solid Rupee Orb */}
                <div className="relative mx-auto flex h-52 w-52 items-center justify-center">
                  {/* Ambient Glow */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#2a234f] via-[#ffb3c3]/20 to-transparent blur-xl" />
                  <div className="absolute h-40 w-40 rounded-full border border-dashed border-[#ffb3c3]/40 animate-spin-slow" />
                  
                  {/* 3D Rupee Image with floating animation */}
                  <img
                    src="/rupee-3d.png"
                    alt="3D Solid Metallic Indian Rupee"
                    className="relative z-10 h-36 w-36 object-contain drop-shadow-[0_15px_30px_rgba(42,35,79,0.8)] animate-pulse"
                    draggable={false}
                  />
                </div>

                {/* Mobile Preview Cards */}

                {/* Mobile Preview Cards */}
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-white">
                      <Sparkles size={14} className="text-[#ffb3c3]" />
                      <span>AI Budget Risk Alert</span>
                    </div>
                    <span className="rounded-full bg-emerald-400/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                      Normal
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/60">
                    Groceries burn rate: ₹350/day. You have ₹8,200 safety buffer.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-white">Family Code Sharing</p>
                    <p className="text-[11px] text-white/60">One-click connect for your household</p>
                  </div>
                  <span className="rounded-lg bg-[#ffb3c3]/20 px-2.5 py-1 font-mono text-xs font-bold text-[#ffb3c3]">
                    K92X4P
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section id="features" className="relative z-10 border-t border-white/10 bg-[#140f2b]/60 py-20 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="max-w-xl">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-[#ffb3c3]">
              Engineered For Households
            </span>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Everything your family needs to master shared wealth.
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Feature 1 */}
            <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#ffb3c3]/40 hover:bg-white/[0.08] hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb3c3]/15 text-[#ffb3c3] transition group-hover:scale-110">
                <KeyRound size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">Family Codes</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                No complex email invitation setups. Family administrators share a secure 6-character code that members enter to join immediately.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#ffb3c3]/40 hover:bg-white/[0.08] hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb3c3]/15 text-[#ffb3c3] transition group-hover:scale-110">
                <TrendingUp size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">AI Velocity Radar</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Predictive early-warning system calculating daily burn rates and projecting month-end balances before overspending occurs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#ffb3c3]/40 hover:bg-white/[0.08] hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb3c3]/15 text-[#ffb3c3] transition group-hover:scale-110">
                <Users size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">Household Roles</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Enforced role boundaries (Admin, Member, Viewer) with soft-deletion preserving complete financial audit trails.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all duration-300 hover:border-[#ffb3c3]/40 hover:bg-white/[0.08] hover:-translate-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb3c3]/15 text-[#ffb3c3] transition group-hover:scale-110">
                <ShieldCheck size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">Strict Household Privacy</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Local AI models running on the backend with zero external API calls. Your family's financial transactions stay 100% private.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated AI Intelligence Section */}
      <section id="ai-intelligence" className="relative z-10 py-24 border-t border-white/10 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb3c3]/20 px-3 py-1 text-xs font-semibold text-[#ffb3c3]">
              <Sparkles size={13} />
              Autonomous Financial Intelligence
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Proactive AI that interprets your finances in real time.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
              Unlike generic expense apps that only report historical totals, Family Finance runs 8 specialized local AI capabilities that forecast velocity, catch anomalies, and advise your family before month-end.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* AI Capability 1 */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-transparent p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Budget Risk Radar</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Deterministic daily burn rates, expected pace ratios, and safe daily caps so you never encounter surprise overages.
              </p>
            </div>

            {/* AI Capability 2 */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-transparent p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3]/20 text-[#ffb3c3]">
                <Cpu size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Anomaly Detection</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Identifies 90-day outlier purchases, velocity spikes, and category surges with plain-English contextual explanations.
              </p>
            </div>

            {/* AI Capability 3 */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-transparent p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
                <Bot size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">Conversational Advisor</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Ask natural questions about your family's spending with strict family scoping and 2-hour persisted chat continuity.
              </p>
            </div>

            {/* AI Capability 4 */}
            <div className="rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-transparent p-6 backdrop-blur-md">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
                <PieChart size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-white">1-Click Recommendations</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Synthesizes balanced category targets based on 3–6 month spending patterns with adjustable batch application.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Family Join Code Spotlight Section */}
      <section id="family-code" className="relative z-10 py-20 border-t border-white/10 scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="rounded-[36px] border border-white/15 bg-gradient-to-r from-[#1d163a] to-[#2a234f] p-8 sm:p-14 shadow-2xl">
            <div className="grid items-center gap-8 lg:grid-cols-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ffb3c3]/20 px-3 py-1 text-xs font-semibold text-[#ffb3c3]">
                  <KeyRound size={13} />
                  Instant Family Onboarding
                </span>
                <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                  One simple code connects your entire household.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  Admins simply copy their family code from their dashboard and share it with spouses, children, or relatives. New members enter the code upon signup and are instantly connected with member permissions.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    to="/signup"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#ffb3c3] px-5 py-3 text-xs font-bold text-[#2a234f] shadow-md transition hover:bg-[#ff9fb4]"
                  >
                    <span>Get Your Family Code</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>

              {/* Code visual mock */}
              <div className="flex justify-center">
                <div className="w-full max-w-sm rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-xl shadow-2xl">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#ffb3c3]">
                    Household Access Pass
                  </p>
                  <p className="mt-1 text-lg font-bold text-white">Sharma Family Space</p>
                  <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/15 bg-black/30 p-3.5">
                    <span className="font-mono text-xl font-black tracking-widest text-white">
                      LW4YNN
                    </span>
                    <span className="rounded-lg bg-[#ffb3c3] px-2.5 py-1 text-xs font-bold text-[#2a234f]">
                      Active
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-white/50">
                    Shareable with family members only · Regenerable anytime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Dedicated Security & Privacy Section */}
      <section id="security" className="relative z-10 py-24 border-t border-white/10 bg-[#0c081c] scroll-mt-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-400">
              <ShieldCheck size={13} />
              Zero-Trust Household Data Isolation
            </span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Your family's financial privacy is non-negotiable.
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/70 sm:text-base">
              Family Finance is built from the database up with rigorous security guarantees. Your transactions are never mined, sold, or sent to commercial cloud AI vendors.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
                <Lock size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">Local AI Privacy</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                All AI reasoning runs on local backend Ollama instances. No financial figures are ever sent to external cloud APIs or used to train third-party LLMs.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#ffb3c3]/15 text-[#ffb3c3]">
                <ShieldCheck size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">PostgreSQL Scoping</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Rigid multi-tenant family boundary isolation. Transactions, budgets, and member data are accessible exclusively to authenticated family members.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-7 backdrop-blur-md">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                <Users size={22} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-white">Session Guard & Auto-Logout</h3>
              <p className="mt-2 text-xs leading-relaxed text-white/60">
                Proactive client-side token expiration inspection and automatic 401 interception ensuring expired sessions are instantly cleared for your protection.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[#090616] py-12 text-xs text-white/40">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 sm:flex-row sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffb3c3] text-sm font-bold text-[#2a234f]">
              ₹
            </div>
            <p className="text-sm font-bold text-white">Family Finance</p>
          </div>

          <p>© 2026 Family Finance · Personal & Family Wealth Platform</p>

          <div className="flex items-center gap-5 text-white/60">
            <a href="#features" className="hover:text-white">
              Features
            </a>
            <a href="#ai-intelligence" className="hover:text-white">
              AI
            </a>
            <a href="#security" className="hover:text-white">
              Privacy
            </a>
            <Link to="/login" className="hover:text-white">
              Log In
            </Link>
            <Link to="/signup" className="hover:text-white">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
