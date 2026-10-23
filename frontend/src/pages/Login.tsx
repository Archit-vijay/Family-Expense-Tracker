import { AlertCircle, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getMyFamily } from "../services/familyService";

function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, isAuthenticated, hasFamily } = useAuth();

  const sessionExpired = searchParams.get("session_expired") === "true";
  const accountExists = searchParams.get("exists") === "true";
  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={hasFamily ? "/dashboard" : "/onboarding"} replace />;
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const loginRes = await login(email.trim(), password);

      if (loginRes?.requires2FA && loginRes?.tempToken) {
        navigate("/login/2fa", {
          state: {
            tempToken: loginRes.tempToken,
            email: email.trim(),
          },
          replace: true,
        });
        return;
      }

      const family = await getMyFamily().catch(() => null);
      if (family) {
        navigate("/dashboard", {
          replace: true,
        });
      } else {
        navigate("/onboarding", {
          replace: true,
        });
      }
    } catch (error) {
      console.error("Login failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to log in.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes loginGradient {
            0% {
              background-position: 0% 50%;
            }

            50% {
              background-position: 100% 50%;
            }

            100% {
              background-position: 0% 50%;
            }
          }

          .login-gradient {
            background:
              linear-gradient(
                135deg,
                #17132f 0%,
                #2a234f 32%,
                #443862 58%,
                #7a5d78 78%,
                #ffb3c3 100%
              );

            background-size: 200% 200%;
            animation: loginGradient 20s ease-in-out infinite;
          }

          html.dark .login-gradient {
            background:
              linear-gradient(
                135deg,
                #0b071a 0%,
                #120d28 32%,
                #191238 58%,
                #231742 78%,
                #321a48 100%
              );
            background-size: 200% 200%;
            animation: loginGradient 20s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .login-gradient {
              animation: none;
            }
          }
        `}
      </style>

      <div
        className="
          page-enter
          login-gradient
          min-h-screen
          overflow-y-auto
          text-white
        "
      >
        <div
          className="
            mx-auto
            flex
            min-h-screen
            w-full
            max-w-375
            flex-col
            px-6
            py-7
            sm:px-10
            lg:px-14
            xl:px-20
          "
        >
          {/* Top navigation */}
          <header className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group transition">
              <div
                className="
                  flex h-10 w-10
                  items-center justify-center
                  rounded-xl
                  bg-[#ffb3c3]
                  text-lg font-bold
                  text-[#2a234f]
                  shadow-lg
                  shadow-black/20
                  transition
                  group-hover:scale-105
                "
              >
                ₹
              </div>

              <div>
                <p className="text-sm font-semibold tracking-wide">
                  Family Finance
                </p>

                <p className="text-[10px] uppercase tracking-[0.2em] text-white/45">
                  Personal finance
                </p>
              </div>
            </Link>

            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="text-xs font-medium text-white/60 transition hover:text-white"
              >
                ← Back to home
              </Link>

              <div
                className="
                  hidden
                  items-center
                  gap-2
                  text-[10px]
                  font-medium
                  uppercase
                  tracking-[0.2em]
                  text-white/40
                  sm:flex
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-[#ffb3c3]" />
                Secure access
              </div>
            </div>
          </header>

          {/* Main composition */}
          <main
            className="
              flex
              flex-1
              items-center
              py-16
              lg:py-20
            "
          >
            <div
              className="
                grid
                w-full
                items-center
                gap-14
                lg:grid-cols-[1fr_430px]
                lg:gap-20
                xl:grid-cols-[1fr_470px]
              "
            >
              {/* Brand message */}
              <section className="max-w-2xl">
                <p
                  className="
                    mb-5
                    text-xs
                    font-semibold
                    uppercase
                    tracking-[0.3em]
                    text-[#ffb3c3]
                  "
                >
                  Your money. Your family. One place.
                </p>

                <h1
                  className="
                    max-w-2xl
                    text-5xl
                    font-extrabold
                    leading-[1.02]
                    tracking-[-0.04em]
                    text-white
                    sm:text-6xl
                    lg:text-7xl
                    xl:text-[82px]
                  "
                >
                  Take control
                  <br />
                  of your
                  <br />
                  <span className="text-[#ffb3c3]">
                    family finances.
                  </span>
                </h1>

                <p
                  className="
                    mt-7
                    max-w-lg
                    text-base
                    leading-7
                    text-white/60
                    sm:text-lg
                  "
                >
                  Track expenses, manage budgets and understand
                  where your family's money is going — all from
                  one simple place.
                </p>

                {/* Feature strip */}
                <div
                  className="
                    mt-10
                    flex
                    max-w-lg
                    flex-wrap
                    items-center
                    gap-x-7
                    gap-y-4
                    border-t
                    border-white/15
                    pt-6
                  "
                >
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Track
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Every expense
                    </p>
                  </div>

                  <div className="h-8 w-px bg-white/15" />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Plan
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Your budgets
                    </p>
                  </div>

                  <div className="h-8 w-px bg-white/15" />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Manage
                    </p>

                    <p className="mt-1 text-xs text-white/40">
                      Together
                    </p>
                  </div>
                </div>
              </section>

              {/* Login section */}
              <section className="w-full">
                <div
                  className="
                    rounded-[28px]
                    border
                    border-white/25
                    bg-white/[0.94]
                    p-7
                    shadow-2xl
                    shadow-black/30
                    backdrop-blur-xl
                    sm:p-9
                    dark:border-white/10
                    dark:bg-[#181236]/90
                    dark:shadow-black/60
                  "
                >
                  {/* Card header */}
                  <div className="mb-6">
                    <div className="mb-4 flex items-center justify-between">
                      <span
                        className="
                          rounded-full
                          bg-[#ffb3c3]/20
                          px-3
                          py-1
                          text-[10px]
                          font-semibold
                          uppercase
                          tracking-[0.18em]
                          text-[#2a234f]
                          dark:bg-[#ffb3c3]/15
                          dark:text-[#ffb3c3]
                        "
                      >
                        Sign in
                      </span>

                      <span className="text-xs text-[#9a96a8] dark:text-[#a5a0ba]">
                        Welcome back
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-[#2a234f] dark:text-[#f5f3fa]">
                      Let's get started.
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#77738a] dark:text-[#a5a0ba]">
                      Sign in to continue to your family finance dashboard.
                    </p>
                  </div>

                  {/* Session Expired Notice */}
                  {sessionExpired && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 shadow-xs dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200">
                      <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="font-bold text-amber-950 dark:text-amber-200">Session expired</p>
                        <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                          Your session has timed out for security. Please sign in again to resume.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Account Exists Notice */}
                  {accountExists && (
                    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 shadow-xs dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-200">
                      <AlertCircle size={18} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-bold text-blue-950 dark:text-blue-200">Account already exists</p>
                        <p className="mt-0.5 text-blue-800 dark:text-blue-300">
                          An account is already registered with this email. Please sign in with your password.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="
                          mb-2
                          block
                          text-sm
                          font-medium
                          text-[#77738a]
                          dark:text-[#c4c1d6]
                        "
                      >
                        Email
                      </label>

                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) =>
                          setEmail(event.target.value)
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        className="
                          h-12
                          w-full
                          rounded-xl
                          border
                          border-[#e8e5ef]
                          bg-white
                          px-4
                          text-sm
                          text-[#2a234f]
                          outline-none
                          transition-all
                          duration-200
                          placeholder:text-[#9a96a8]
                          focus:border-[#ffb3c3]
                          focus:ring-4
                          focus:ring-[#ffb3c3]/20
                          dark:border-[#2e265c]
                          dark:bg-[#110c26]
                          dark:text-[#f5f3fa]
                          dark:placeholder:text-[#726b8e]
                        "
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label
                        htmlFor="password"
                        className="
                          mb-2
                          block
                          text-sm
                          font-medium
                          text-[#77738a]
                          dark:text-[#c4c1d6]
                        "
                      >
                        Password
                      </label>

                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) =>
                          setPassword(event.target.value)
                        }
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        className="
                          h-12
                          w-full
                          rounded-xl
                          border
                          border-[#e8e5ef]
                          bg-white
                          px-4
                          text-sm
                          text-[#2a234f]
                          outline-none
                          transition-all
                          duration-200
                          placeholder:text-[#9a96a8]
                          focus:border-[#ffb3c3]
                          focus:ring-4
                          focus:ring-[#ffb3c3]/20
                          dark:border-[#2e265c]
                          dark:bg-[#110c26]
                          dark:text-[#f5f3fa]
                          dark:placeholder:text-[#726b8e]
                        "
                      />
                    </div>

                    {/* Error */}
                    {error && (
                      <div
                        className="
                          rounded-xl
                          border
                          border-rose-200
                          bg-rose-50
                          px-4
                          py-3
                          text-sm
                          text-rose-600
                          dark:border-rose-500/30
                          dark:bg-rose-950/40
                          dark:text-rose-300
                        "
                      >
                        {error}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        group
                        relative
                        flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        gap-2
                        rounded-xl
                        bg-[#2a234f]
                        text-sm
                        font-semibold
                        tracking-wide
                        text-white
                        shadow-md
                        shadow-[#2a234f]/25
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:bg-[#1f1a3b]
                        hover:shadow-lg
                        hover:shadow-[#2a234f]/35
                        active:translate-y-0
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        dark:border
                        dark:border-[#4d4090]/80
                        dark:bg-gradient-to-r
                        dark:from-[#2a234f]
                        dark:to-[#382e6e]
                        dark:text-[#f5f3fa]
                        dark:shadow-md
                        dark:shadow-black/50
                        dark:hover:from-[#332b5f]
                        dark:hover:to-[#433785]
                        dark:hover:border-[#ffb3c3]/40
                      "
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin text-[#ffb3c3]" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign in</span>
                          <ArrowRight
                            size={16}
                            className="text-[#ffb3c3] transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Signup */}
                  <div className="mt-5 text-center">
                    <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                      Don't have an account yet?{" "}
                      <Link
                        to="/signup"
                        className="font-bold text-[#2a234f] underline decoration-[#ffb3c3] decoration-2 underline-offset-4 transition-colors hover:text-[#1f1a3b] dark:text-[#ffb3c3] dark:hover:text-[#ff9fb4]"
                      >
                        Sign up for free
                      </Link>
                    </p>
                  </div>

                  {/* Card footer */}
                  <div
                    className="
                      mt-6
                      flex
                      items-center
                      gap-2
                      border-t
                      border-[#e8e5ef]
                      pt-5
                      dark:border-white/10
                    "
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <p className="text-xs text-[#9a96a8] dark:text-[#a5a0ba]">
                      Your family finances, organized in one place.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </main>

          {/* Footer */}
          <footer
            className="
              flex
              flex-col
              gap-2
              border-t
              border-white/10
              pt-5
              text-xs
              text-white/35
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p>
              © 2026 Family Finance
            </p>

            <p>
              Manage money together.
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default Login;
