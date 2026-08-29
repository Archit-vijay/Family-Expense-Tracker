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
    <div className="min-h-screen bg-slate-950">
      <div className="flex min-h-screen">

        {/* Left side */}
        <div
          className="
            relative hidden overflow-hidden
            lg:flex lg:w-1/2
            items-center justify-center
            bg-gradient-to-br
            from-violet-950
            via-slate-950
            to-indigo-950
          "
        >
          <div
            className="
              absolute -left-24 -top-24
              h-72 w-72
              rounded-full
              bg-violet-500/20
              blur-3xl
            "
          />

          <div
            className="
              absolute -bottom-24 -right-24
              h-72 w-72
              rounded-full
              bg-indigo-500/20
              blur-3xl
            "
          />

          <div className="relative z-10 max-w-lg px-12">
            <div className="mb-6 flex items-center gap-3">
              <div
                className="
                  flex h-12 w-12
                  items-center justify-center
                  rounded-2xl
                  bg-violet-500
                  text-xl font-bold
                  text-white
                  shadow-lg
                  shadow-violet-500/30
                "
              >
                ₹
              </div>

              <span className="text-2xl font-bold text-white">
                Family Finance
              </span>
            </div>

            <h1
              className="
                text-5xl
                font-bold
                leading-tight
                tracking-tight
                text-white
              "
            >
              Take control of
              <span className="text-violet-400">
                {" "}your family finances.
              </span>
            </h1>

            <p className="mt-6 text-lg leading-8 text-slate-300">
              Track expenses, manage budgets and understand
              where your family's money is going — all in one
              place.
            </p>
          </div>
        </div>

        {/* Right side */}
        <div
          className="
            flex w-full
            items-center justify-center
            bg-slate-50
            px-6 py-12
            lg:w-1/2
          "
        >
          <div className="w-full max-w-md">

            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div
                  className="
                    flex h-11 w-11
                    items-center justify-center
                    rounded-xl
                    bg-violet-600
                    font-bold text-white
                  "
                >
                  ₹
                </div>

                <span className="text-xl font-bold text-slate-900">
                  Family Finance
                </span>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900">
                Welcome back
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Sign in to continue to your dashboard.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
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
                    h-12 w-full
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4
                    text-sm text-slate-800
                    outline-none
                    transition-all duration-200
                    placeholder:text-slate-400
                    focus:border-violet-400
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="
                    mb-2 block
                    text-sm font-medium
                    text-slate-700
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
                    h-12 w-full
                    rounded-xl
                    border border-slate-200
                    bg-white
                    px-4
                    text-sm text-slate-800
                    outline-none
                    transition-all duration-200
                    placeholder:text-slate-400
                    focus:border-violet-400
                    focus:ring-4
                    focus:ring-violet-500/10
                  "
                />
              </div>

              {error && (
                <div
                  className="
                    rounded-xl
                    border border-rose-200
                    bg-rose-50
                    px-4 py-3
                    text-sm text-rose-600
                  "
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="
                  flex h-12 w-full
                  items-center justify-center
                  rounded-xl
                  bg-violet-600
                  text-sm font-semibold
                  text-white
                  shadow-lg
                  shadow-violet-500/20
                  transition-all duration-200
                  hover:-translate-y-0.5
                  hover:bg-violet-700
                  hover:shadow-xl
                  hover:shadow-violet-500/25
                  active:translate-y-0
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;