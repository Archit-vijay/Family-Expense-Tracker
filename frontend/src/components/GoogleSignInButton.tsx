import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { googleAuth } from "../services/authService";

declare global {
  interface Window {
    google?: any;
  }
}

interface GoogleSignInButtonProps {
  className?: string;
  text?: string;
  variant?: "landing" | "form" | "default";
}

export default function GoogleSignInButton({
  className = "",
  text = "Continue with Google",
  variant = "default",
}: GoogleSignInButtonProps) {
  const navigate = useNavigate();
  const { setSession, refreshFamily } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // Initialize Google OAuth2 Token Client once Google Identity Services script is ready
  useEffect(() => {
    let checkInterval: any = null;

    function setupClient() {
      if (!clientId || !window.google?.accounts?.oauth2) return;

      try {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: { access_token?: string; error?: string }) => {
            if (tokenResponse.error) {
              if (tokenResponse.error !== "access_denied") {
                setError("Google sign-in was not completed.");
              }
              setIsLoading(false);
              return;
            }

            if (!tokenResponse.access_token) {
              setIsLoading(false);
              return;
            }

            try {
              setIsLoading(true);
              setError(null);

              const data = await googleAuth({
                accessToken: tokenResponse.access_token,
              });

              setSession(data.token, data.user);
              const family = await refreshFamily();

              if (family) {
                navigate("/dashboard", { replace: true });
              } else {
                navigate("/onboarding", { replace: true });
              }
            } catch (err: any) {
              console.error("Google authentication failed:", err);
              setError(err.message || "Failed to authenticate with Google.");
            } finally {
              setIsLoading(false);
            }
          },
        });
      } catch (err) {
        console.warn("Could not initialize Google OAuth2 client:", err);
      }
    }

    if (window.google?.accounts?.oauth2) {
      setupClient();
    } else {
      checkInterval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(checkInterval);
          setupClient();
        }
      }, 100);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [clientId, navigate, setSession, refreshFamily]);

  function handleGoogleClick() {
    if (isLoading) return;
    setError(null);

    if (!clientId) {
      setError("Google OAuth is not configured (missing VITE_GOOGLE_CLIENT_ID).");
      return;
    }

    if (!tokenClientRef.current) {
      if (window.google?.accounts?.oauth2) {
        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              try {
                setIsLoading(true);
                const data = await googleAuth({
                  accessToken: tokenResponse.access_token,
                });
                setSession(data.token, data.user);
                const family = await refreshFamily();
                if (family) navigate("/dashboard", { replace: true });
                else navigate("/onboarding", { replace: true });
              } catch (err: any) {
                setError(err.message || "Failed to authenticate with Google.");
              } finally {
                setIsLoading(false);
              }
            } else {
              setIsLoading(false);
            }
          },
        });
        setIsLoading(true);
        tokenClientRef.current.requestAccessToken({ prompt: "" });
        return;
      }

      setError("Google authentication service is still loading. Please try again in a moment.");
      return;
    }

    setIsLoading(true);
    // Request authentic Google OAuth popup dialog
    tokenClientRef.current.requestAccessToken({ prompt: "" });
  }

  // Visual variants for perfect UI integration across pages
  const isLanding = variant === "landing";

  const buttonClasses = isLanding
    ? "inline-flex h-12 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-white shadow-sm backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:border-white/35 active:scale-[0.98] disabled:opacity-60"
    : "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#e8e5ef] bg-white px-5 text-sm font-semibold text-[#2a234f] shadow-xs transition-all duration-200 hover:bg-[#f8f7fb] hover:border-[#d6d2e1] active:scale-[0.99] disabled:opacity-60 dark:border-[#2e265c] dark:bg-[#1a153b] dark:text-[#f5f3fa] dark:hover:bg-[#231c4f] dark:hover:border-[#3d3372]";

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <button
        type="button"
        onClick={handleGoogleClick}
        disabled={isLoading}
        aria-label={text}
        className={`${buttonClasses} ${className}`}
      >
        {isLoading ? (
          <>
            <Loader2
              size={18}
              className={`animate-spin ${isLanding ? "text-white" : "text-[#2a234f] dark:text-[#ffb3c3]"}`}
            />
            <span className="text-xs font-semibold">
              Authenticating with Google...
            </span>
          </>
        ) : (
          <>
            <svg
              className="h-4.5 w-4.5 shrink-0"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                fill="#EA4335"
              />
            </svg>
            <span>{text}</span>
          </>
        )}
      </button>

      {error && (
        <p className="mt-2 text-center text-xs font-medium text-rose-500 max-w-[320px]">
          {error}
        </p>
      )}
    </div>
  );
}
