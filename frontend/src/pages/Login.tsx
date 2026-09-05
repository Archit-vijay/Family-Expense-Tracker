import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
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

      await login(email.trim(), password);

      navigate("/dashboard", {
        replace: true,
      });
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

          @media (prefers-reduced-motion: reduce) {
            .login-gradient {
              animation: none;
            }
          }
        `}
      </style>

      <div
        className="
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
            <div className="flex items-center gap-3">
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
            </div>

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
                  "
                >
                  {/* Card header */}
                  <div className="mb-8">
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
                        "
                      >
                        Sign in
                      </span>

                      <span className="text-xs text-[#9a96a8]">
                        Welcome back
                      </span>
                    </div>

                    <h2 className="text-3xl font-bold tracking-tight text-[#2a234f]">
                      Let's get started.
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-[#77738a]">
                      Sign in to continue to your family
                      finance dashboard.
                    </p>
                  </div>

                  {/* Form */}
                  <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
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
                        flex
                        h-12
                        w-full
                        items-center
                        justify-center
                        rounded-xl
                        bg-[#2a234f]
                        text-sm
                        font-semibold
                        text-white
                        shadow-lg
                        shadow-[#2a234f]/20
                        transition-all
                        duration-200
                        hover:-translate-y-0.5
                        hover:bg-[#ffb3c3]
                        hover:text-[#2a234f]
                        hover:shadow-xl
                        hover:shadow-[#ffb3c3]/20
                        active:translate-y-0
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                      "
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </button>
                  </form>

                  {/* Card footer */}
                  <div
                    className="
                      mt-7
                      flex
                      items-center
                      gap-2
                      border-t
                      border-[#e8e5ef]
                      pt-5
                    "
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

                    <p className="text-xs text-[#9a96a8]">
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
