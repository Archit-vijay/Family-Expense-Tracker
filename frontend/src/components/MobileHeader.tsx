import {
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

function MobileHeader() {
  const { user, familyRole, logout } = useAuth();
  const navigate = useNavigate();

  const [isNavigationOpen, setIsNavigationOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    if (isNavigationOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setIsUserMenuOpen(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isNavigationOpen]);

  function handleLogout() {
    setIsNavigationOpen(false);
    setIsUserMenuOpen(false);
    logout();
    navigate("/login", { replace: true });
  }

  function getRoleLabel() {
    if (familyRole === "admin") {
      return "Family Admin";
    }

    if (familyRole === "viewer") {
      return "Family Viewer";
    }

    return "Family Member";
  }

  const navigationItems = [
    { label: "Dashboard", to: "/dashboard" },
    {
      label: "AI Assistant",
      to: "/ai-assistant",
    },
    {
      label: "AI Insights",
      to: "/insights",
    },
    { label: "Transactions", to: "/transactions" },
    { label: "Budgets", to: "/budgets" },
    { label: "Recurring & Bills", to: "/recurring" },
    { label: "Family", to: "/family" },
    { label: "Settings", to: "/settings" },
  ];

  return (
    <>
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e8e5ef] bg-white/85 px-4 backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setIsNavigationOpen(true)}
          aria-label="Open navigation"
          aria-expanded={isNavigationOpen}
          className="rounded-xl p-2 text-[#77738a] transition hover:bg-[#f8f7fb] hover:text-[#2a234f]"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ffb3c3] text-sm font-bold text-[#2a234f]">
            F
          </div>

          <span className="font-semibold text-[#2a234f]">
            Family Finance
          </span>
        </div>

        <div className="h-10 w-10" aria-hidden="true" />
      </header>

      {isNavigationOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Backdrop overlay */}
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[#2a234f]/60 backdrop-blur-sm"
            onClick={() => {
              setIsNavigationOpen(false);
              setIsUserMenuOpen(false);
            }}
          />

          {/* Drawer container */}
          <nav
            aria-label="Mobile navigation"
            className="relative z-10 flex h-full w-72 max-w-[85vw] flex-col justify-between bg-[#2a234f] shadow-2xl shadow-[#2a234f]/50 animate-[mobile-nav-in_200ms_ease-out]"
          >
            {/* Top brand & close button */}
            <div className="flex items-center justify-between px-4 pt-5 pb-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3] text-lg font-bold text-[#2a234f] shadow-lg shadow-black/20">
                  F
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-wide text-white">
                    Family
                  </p>
                  <p className="text-sm font-semibold tracking-wide text-[#ffb3c3]">
                    Finance
                  </p>
                </div>
              </div>

              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => {
                  setIsNavigationOpen(false);
                  setIsUserMenuOpen(false);
                }}
                className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation links */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1.5">
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
                Menu
              </p>

              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => {
                    setIsNavigationOpen(false);
                    setIsUserMenuOpen(false);
                  }}
                  className={({ isActive }) =>
                    `block rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* User Profile & Sign Out section (mirrors PC sidebar) */}
            <div className="border-t border-white/10 p-4">
              <div className="relative">
                {/* User button */}
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen((prev) => !prev)}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-3 text-left transition-all duration-200 hover:bg-white/10 active:scale-[0.99]"
                >
                  {/* Avatar */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#ffb3c3] text-sm font-bold text-[#2a234f]">
                    {user?.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>

                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.name ?? "User"}
                    </p>
                    <p className="truncate text-xs text-white/40">
                      {getRoleLabel()}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  {isUserMenuOpen ? (
                    <ChevronUp size={18} className="shrink-0 text-[#ffb3c3]" />
                  ) : (
                    <ChevronDown size={18} className="shrink-0 text-white/50" />
                  )}
                </button>

                {/* Dropdown Menu */}
                <div
                  className={`absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-xl border border-white/10 bg-[#211b40] p-1 shadow-2xl shadow-black/30 transition-all duration-200 ease-out ${
                    isUserMenuOpen
                      ? "translate-y-0 scale-100 opacity-100 pointer-events-auto"
                      : "translate-y-2 scale-[0.98] opacity-0 pointer-events-none"
                  }`}
                  aria-hidden={!isUserMenuOpen}
                >
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-colors duration-150 hover:bg-[#ffb3c3] hover:text-[#2a234f] focus-visible:bg-[#ffb3c3] focus-visible:text-[#2a234f] focus-visible:outline-none"
                  >
                    <LogOut size={16} className="shrink-0" />
                    <span>Sign out</span>
                  </button>
                </div>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default MobileHeader;
