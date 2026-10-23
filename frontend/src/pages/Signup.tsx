import { ArrowRight, Check, Loader2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { signup } from "../services/authService";

function Signup() {
  const navigate = useNavigate();
  const { setSession, isAuthenticated, hasFamily } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to={hasFamily ? "/dashboard" : "/onboarding"} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError("Please fill out all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const data = await signup({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      // Update auth session
      setSession(data.token, data.user);

      // Newly signed up user needs to create or join a family
      navigate("/onboarding", {
        replace: true,
      });
    } catch (err: any) {
      console.error("Signup failed:", err);

      // If account already exists with this email, redirect to login page with alert
      if (err?.code === "EMAIL_ALREADY_EXISTS" || err?.status === 409) {
        navigate(`/login?email=${encodeURIComponent(email.trim())}&exists=true`, {
          replace: true,
        });
        return;
      }

      setError(err?.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>
        {`
          @keyframes signupGradient {
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

          .signup-gradient {
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
            animation: signupGradient 20s ease-in-out infinite;
          }

          html.dark .signup-gradient {
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
            animation: signupGradient 20s ease-in-out infinite;
          }

          @media (prefers-reduced-motion: reduce) {
            .signup-gradient {
              animation: none;
            }
          }
        `}
      </style>

      <div
        className="
          page-enter
          signup-gradient
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
                Bank-grade encryption
              </div>
            </div>
          </header>

          {/* Main composition */}
          <main
            className="
              flex
              flex-1
              items-center
              py-12
              lg:py-16
            "
          >
            <div
              className="
                grid
                w-full
                items-center
                gap-12
                lg:grid-cols-[1fr_450px]
                lg:gap-16
                xl:grid-cols-[1fr_490px]
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
                  Join thousands of disciplined families
                </p>

                <h1
                  className="
                    max-w-2xl
                    text-4xl
                    font-extrabold
                    leading-[1.05]
                    tracking-[-0.03em]
                    text-white
                    sm:text-5xl
                    lg:text-6xl
                    xl:text-[72px]
                  "
                >
                  Start your shared
                  <br />
                  wealth journey
                  <br />
                  <span className="text-[#ffb3c3]">
                    in seconds.
                  </span>
                </h1>

                <p
                  className="
                    mt-6
                    max-w-lg
                    text-base
                    leading-7
                    text-white/65
                    sm:text-lg
                  "
                >
                  Create an account to start a new family space or join an existing family with a secure invite code.
                </p>

                {/* Key value propositions */}
                <div className="mt-8 space-y-3.5 max-w-lg">
                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffb3c3]/20 text-[#ffb3c3]">
                      <Check size={13} />
                    </div>
                    <span>No card required. Free and open for your entire household.</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffb3c3]/20 text-[#ffb3c3]">
                      <Check size={13} />
                    </div>
                    <span>Instant 6-character code sharing for household members.</span>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-white/80">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ffb3c3]/20 text-[#ffb3c3]">
                      <Check size={13} />
                    </div>
                    <span>AI-powered velocity radar and automated monthly insights.</span>
                  </div>
                </div>
              </section>

              {/* Signup section card */}
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
                    <div className="mb-3 flex items-center justify-between">
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
                        Create account
                      </span>

                      <span className="flex items-center gap-1.5 text-xs text-[#9a96a8] dark:text-[#a5a0ba]">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        Private & secure
                      </span>
                    </div>

                    <h2 className="text-2xl font-bold tracking-tight text-[#2a234f] sm:text-3xl dark:text-[#f5f3fa]">
                      Get started free
                    </h2>

                    <p className="mt-1.5 text-xs leading-5 text-[#77738a] sm:text-sm dark:text-[#a5a0ba]">
                      Create your global account to establish or join your family finance workspace.
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Full Name */}
                    <div>
                      <label
                        htmlFor="name"
                        className="
                          mb-1.5
                          block
                          text-xs
                          font-semibold
                          text-[#77738a]
                          dark:text-[#c4c1d6]
                        "
                      >
                        Your Full Name
                      </label>

                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) =>
                          setName(event.target.value)
                        }
                        placeholder="e.g. Rahul Sharma"
                        autoComplete="name"
                        className="
                          h-11
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

                    {/* Email */}
                    <div>
                      <label
                        htmlFor="email"
                        className="
                          mb-1.5
                          block
                          text-xs
                          font-semibold
                          text-[#77738a]
                          dark:text-[#c4c1d6]
                        "
                      >
                        Email Address
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
                          h-11
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

                    {/* Password Grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="password"
                          className="
                            mb-1.5
                            block
                            text-xs
                            font-semibold
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
                          placeholder="Min 6 characters"
                          autoComplete="new-password"
                          className="
                            h-11
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

                      <div>
                        <label
                          htmlFor="confirmPassword"
                          className="
                            mb-1.5
                            block
                            text-xs
                            font-semibold
                            text-[#77738a]
                            dark:text-[#c4c1d6]
                          "
                        >
                          Confirm Password
                        </label>

                        <input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(event) =>
                            setConfirmPassword(event.target.value)
                          }
                          placeholder="Repeat password"
                          autoComplete="new-password"
                          className="
                            h-11
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
                          py-2.5
                          text-xs
                          font-medium
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
                        mt-2
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
                          <span>Creating account...</span>
                        </>
                      ) : (
                        <>
                          <span>Create account</span>
                          <ArrowRight
                            size={16}
                            className="text-[#ffb3c3] transition-transform duration-200 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Switch to Login */}
                  <div className="mt-5 text-center">
                    <p className="text-xs text-[#77738a] dark:text-[#a5a0ba]">
                      Already have an account?{" "}
                      <Link
                        to="/login"
                        className="font-bold text-[#2a234f] underline decoration-[#ffb3c3] decoration-2 underline-offset-4 transition-colors hover:text-[#1f1a3b] dark:text-[#ffb3c3] dark:hover:text-[#ff9fb4]"
                      >
                        Sign in
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
                      pt-4
                      dark:border-white/10
                    "
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <p className="text-xs text-[#9a96a8] dark:text-[#a5a0ba]">
                      By signing up you agree to family data collaboration terms.
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

export default Signup;
