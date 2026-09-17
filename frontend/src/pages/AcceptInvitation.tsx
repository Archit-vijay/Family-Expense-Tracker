import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";

import {
  acceptInvitation,
  getInvitation,
} from "../services/invitationService";

import { useAuth } from "../context/AuthContext";

function AcceptInvitation() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [isLoading, setIsLoading] = useState(true);

  const [invitation, setInvitation] = useState<{
    familyMemberId: number;
    memberName: string;
    email: string;
    expiresAt: string;
  } | null>(null);

  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [isCreatingAccount, setIsCreatingAccount] =
    useState(false);

  const [creationError, setCreationError] = useState("");

  useEffect(() => {
    async function loadInvitation() {
      if (!token) {
        setError("This invitation link is invalid.");
        setIsLoading(false);
        return;
      }

      try {
        const result = await getInvitation(token);
        setInvitation(result);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load this invitation.",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  const passwordLengthValid = password.length >= 8;
  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  async function handleCreateAccount() {
    if (!token || !invitation) {
      return;
    }

    setCreationError("");

    if (!passwordLengthValid) {
      setCreationError(
        "Password must be at least 8 characters long.",
      );
      return;
    }

    if (!passwordsMatch) {
      setCreationError("Passwords do not match.");
      return;
    }

    setIsCreatingAccount(true);

    try {
      const result = await acceptInvitation(
        token,
        password,
      );

      setSession(result.token, result.user);

      navigate("/dashboard", {
        replace: true,
      });
    } catch (err) {
      setCreationError(
        err instanceof Error
          ? err.message
          : "Failed to create your family account.",
      );
    } finally {
      setIsCreatingAccount(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f7fb] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        {/* Brand */}
        <header className="flex items-center justify-center">
          <Link
            to="/login"
            className="
              group inline-flex items-center gap-3
              rounded-full border border-[#e8e5ef]
              bg-white px-4 py-2
              shadow-sm
              transition-all duration-200
              hover:-translate-y-0.5
              hover:border-[#ffb3c3]
              hover:shadow-md
            "
          >
            <span
              className="
                flex h-9 w-9 items-center justify-center
                rounded-xl bg-[#ffb3c3]
                text-sm font-extrabold text-[#2a234f]
              "
            >
              F
            </span>

            <span className="text-sm font-bold text-[#2a234f]">
              Family Finance
            </span>
          </Link>
        </header>

        {isLoading ? (
          <main className="mt-12">
            <div
              className="
                overflow-hidden rounded-3xl
                border border-[#e8e5ef]
                bg-white shadow-sm
              "
            >
              <div className="px-6 py-16 text-center sm:px-10 sm:py-20">
                <div
                  className="
                    mx-auto flex h-16 w-16 items-center justify-center
                    rounded-2xl bg-[#ffb3c3]/20
                  "
                >
                  <Loader2
                    size={26}
                    className="animate-spin text-[#2a234f]"
                  />
                </div>

                <h1 className="mt-6 text-xl font-bold text-[#2a234f]">
                  Checking your invitation
                </h1>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#77738a]">
                  We're securely verifying your invitation link. This
                  will only take a moment.
                </p>
              </div>
            </div>
          </main>
        ) : error ? (
          <main className="mt-12">
            <div
              className="
                overflow-hidden rounded-3xl
                border border-[#e8e5ef]
                bg-white shadow-sm
              "
            >
              <div className="px-6 py-14 text-center sm:px-12 sm:py-16">
                <div
                  className="
                    mx-auto flex h-16 w-16 items-center justify-center
                    rounded-2xl bg-rose-50
                  "
                >
                  <XCircle
                    size={28}
                    className="text-rose-500"
                  />
                </div>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#9a96a8]">
                  Invitation
                </p>

                <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-[#2a234f] sm:text-3xl">
                  Invitation unavailable
                </h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#77738a]">
                  {error}
                </p>

                <Link
                  to="/login"
                  className="
                    mt-8 inline-flex items-center justify-center gap-2
                    rounded-xl bg-[#2a234f]
                    px-6 py-3
                    text-sm font-semibold text-white
                    transition-all duration-200
                    hover:-translate-y-0.5
                    hover:bg-[#1f1a3b]
                    hover:shadow-lg hover:shadow-[#2a234f]/15
                    active:translate-y-0
                    active:scale-[0.98]
                  "
                >
                  Go to login
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </main>
        ) : invitation ? (
          <main className="mt-10 pb-8 sm:mt-14">
            {/* Intro */}
            <section className="text-center">
              <div
                className="
                  mx-auto flex h-16 w-16 items-center justify-center
                  rounded-2xl
                  bg-[#2a234f]
                  shadow-lg shadow-[#2a234f]/15
                "
              >
                <Users
                  size={28}
                  className="text-[#ffb3c3]"
                />
              </div>

              <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#9a96a8]">
                Family invitation
              </p>

              <h1
                className="
                  mx-auto mt-3 max-w-2xl
                  text-3xl font-extrabold tracking-tight
                  text-[#2a234f]
                  sm:text-4xl lg:text-5xl
                "
              >
                Your family is waiting for you.
              </h1>

              <p
                className="
                  mx-auto mt-4 max-w-xl
                  text-sm leading-7 text-[#77738a]
                  sm:text-base
                "
              >
                You've been invited to join a family on Family Finance.
                Create your account and start managing your family's
                money together.
              </p>
            </section>

            {/* Invitation + account creation */}
            <section
              className="
                mt-10 overflow-hidden
                rounded-3xl
                border border-[#e8e5ef]
                bg-[#f1eff7]
                shadow-sm
                transition-shadow duration-300
                hover:shadow-md
              "
            >
              {/* Header */}
              <div className="border-b border-[#e8e5ef] px-6 py-6 sm:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a96a8]">
                      You're invited
                    </p>

                    <h2 className="mt-1 text-lg font-bold text-[#2a234f]">
                      Join your family
                    </h2>
                  </div>

                  <div
                    className="
                      flex h-10 w-10 shrink-0 items-center justify-center
                      rounded-xl bg-[#ffb3c3]/20
                    "
                  >
                    <CheckCircle2
                      size={20}
                      className="text-[#2a234f]"
                    />
                  </div>
                </div>
              </div>

              <div className="px-6 py-7 sm:px-8">
                {/* Member identity */}
                <div
                  className="
                    flex items-center gap-4
                    rounded-2xl
                    border border-[#e8e5ef]
                    bg-[#f8f7fb]
                    p-4
                  "
                >
                  <div
                    className="
                      flex h-14 w-14 shrink-0 items-center justify-center
                      rounded-2xl
                      bg-[#2a234f]
                      text-lg font-extrabold
                      text-[#ffb3c3]
                    "
                  >
                    {invitation.memberName.charAt(0).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#9a96a8]">
                      Family member
                    </p>

                    <p className="mt-1 truncate text-base font-bold text-[#2a234f]">
                      {invitation.memberName}
                    </p>

                    <p className="mt-1 truncate text-sm text-[#77738a]">
                      {invitation.email}
                    </p>
                  </div>
                </div>

                {/* Trust information */}
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div
                    className="
                      rounded-2xl border border-[#e8e5ef]
                      bg-white p-4
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-xl bg-[#ffb3c3]/20
                        "
                      >
                        <ShieldCheck
                          size={18}
                          className="text-[#2a234f]"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-[#2a234f]">
                          Secure invitation
                        </p>

                        <p className="mt-0.5 text-xs text-[#77738a]">
                          Private & protected
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="
                      rounded-2xl border border-[#e8e5ef]
                      bg-white p-4
                    "
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="
                          flex h-9 w-9 shrink-0 items-center justify-center
                          rounded-xl bg-[#ffb3c3]/20
                        "
                      >
                        <Clock3
                          size={18}
                          className="text-[#2a234f]"
                        />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-[#2a234f]">
                          48 hour expiry
                        </p>

                        <p className="mt-0.5 text-xs text-[#77738a]">
                          Accept before it expires
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Account creation */}
                <div className="mt-8 border-t border-[#e8e5ef] pt-8">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9a96a8]">
                      Create your account
                    </p>

                    <h3 className="mt-2 text-xl font-bold text-[#2a234f]">
                      Choose a secure password
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-[#77738a]">
                      Your account will be connected to the invited family
                      member above.
                    </p>
                  </div>

                  {/* Password */}
                  <div className="mt-6">
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-[#2a234f]"
                    >
                      Password
                    </label>

                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => {
                          setPassword(event.target.value);
                          setCreationError("");
                        }}
                        placeholder="Enter your password"
                        autoComplete="new-password"
                        className="
                          w-full rounded-xl
                          border border-[#dcd8e7]
                          bg-white
                          px-4 py-3
                          pr-12
                          text-sm text-[#2a234f]
                          outline-none
                          transition-all duration-200
                          placeholder:text-[#aaa6b6]
                          focus:border-[#2a234f]
                          focus:ring-4 focus:ring-[#2a234f]/5
                        "
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword((current) => !current)
                        }
                        className="
                          absolute right-3 top-1/2
                          flex -translate-y-1/2
                          items-center justify-center
                          rounded-lg p-1.5
                          text-[#9a96a8]
                          transition-colors duration-200
                          hover:bg-[#f8f7fb]
                          hover:text-[#2a234f]
                        "
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`
                          flex h-4 w-4 items-center justify-center rounded-full
                          transition-colors duration-200
                          ${
                            passwordLengthValid
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-[#e8e5ef] text-transparent"
                          }
                        `}
                      >
                        <Check size={10} strokeWidth={3} />
                      </span>

                      <span className="text-xs text-[#77738a]">
                        At least 8 characters
                      </span>
                    </div>
                  </div>

                  {/* Confirm password */}
                  <div className="mt-5">
                    <label
                      htmlFor="confirmPassword"
                      className="mb-2 block text-sm font-semibold text-[#2a234f]"
                    >
                      Confirm password
                    </label>

                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        value={confirmPassword}
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setCreationError("");
                        }}
                        placeholder="Re-enter your password"
                        autoComplete="new-password"
                        className={`
                          w-full rounded-xl
                          border
                          bg-white
                          px-4 py-3
                          pr-12
                          text-sm text-[#2a234f]
                          outline-none
                          transition-all duration-200
                          placeholder:text-[#aaa6b6]
                          focus:ring-4 focus:ring-[#2a234f]/5
                          ${
                            confirmPassword.length > 0 &&
                            !passwordsMatch
                              ? "border-rose-300 focus:border-rose-400"
                              : "border-[#dcd8e7] focus:border-[#2a234f]"
                          }
                        `}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current,
                          )
                        }
                        className="
                          absolute right-3 top-1/2
                          flex -translate-y-1/2
                          items-center justify-center
                          rounded-lg p-1.5
                          text-[#9a96a8]
                          transition-colors duration-200
                          hover:bg-[#f8f7fb]
                          hover:text-[#2a234f]
                        "
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirmed password"
                            : "Show confirmed password"
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    {confirmPassword.length > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <span
                          className={`
                            flex h-4 w-4 items-center justify-center rounded-full
                            ${
                              passwordsMatch
                                ? "bg-emerald-100 text-emerald-600"
                                : "bg-rose-100 text-rose-500"
                            }
                          `}
                        >
                          <Check size={10} strokeWidth={3} />
                        </span>

                        <span
                          className={`
                            text-xs
                            ${
                              passwordsMatch
                                ? "text-emerald-600"
                                : "text-rose-500"
                            }
                          `}
                        >
                          {passwordsMatch
                            ? "Passwords match"
                            : "Passwords do not match"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Error */}
                  {creationError && (
                    <div
                      className="
                        mt-5 rounded-xl
                        border border-rose-200
                        bg-rose-50
                        px-4 py-3
                        text-sm text-rose-600
                      "
                    >
                      {creationError}
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="button"
                    onClick={handleCreateAccount}
                    disabled={
                      isCreatingAccount ||
                      !passwordLengthValid ||
                      !passwordsMatch
                    }
                    className="
                      mt-6 flex w-full items-center justify-center gap-2
                      rounded-xl
                      bg-[#2a234f]
                      px-5 py-3.5
                      text-sm font-bold text-white
                      transition-all duration-200
                      hover:-translate-y-0.5
                      hover:bg-[#1f1a3b]
                      hover:shadow-lg hover:shadow-[#2a234f]/15
                      active:translate-y-0
                      active:scale-[0.98]
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                      disabled:hover:translate-y-0
                      disabled:hover:shadow-none
                    "
                  >
                    {isCreatingAccount ? (
                      <>
                        <Loader2
                          size={17}
                          className="animate-spin"
                        />
                        Creating your account...
                      </>
                    ) : (
                      <>
                        Create my account
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>

                  <p className="mt-4 text-center text-xs leading-5 text-[#9a96a8]">
                    By creating your account, you'll join this family
                    member's Family Finance account.
                  </p>
                </div>
              </div>
            </section>

            {/* Bottom reassurance */}
            <section className="mt-8 text-center">
              <p className="text-xs leading-5 text-[#9a96a8]">
                Family Finance keeps your family's financial information
                organized, private, and easy to manage together.
              </p>
            </section>
          </main>
        ) : null}
      </div>
    </div>
  );
}

export default AcceptInvitation;