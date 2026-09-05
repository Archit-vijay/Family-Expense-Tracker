import { Menu, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState } from "react";

function MobileHeader() {
  const [isNavigationOpen, setIsNavigationOpen] =
    useState(false);

  const navigationItems = [
    { label: "Dashboard", to: "/dashboard" },
    { label: "Transactions", to: "/transactions" },
    { label: "Budgets", to: "/budgets" },
    { label: "Reports", to: "/reports" },
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
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-[#2a234f]/40 backdrop-blur-sm"
            onClick={() => setIsNavigationOpen(false)}
          />

          <nav
            aria-label="Mobile navigation"
            className="relative h-full w-72 max-w-[85vw] bg-[#2a234f] px-4 py-5 shadow-2xl shadow-[#2a234f]/30 animate-[mobile-nav-in_200ms_ease-out]"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffb3c3] text-lg font-bold text-[#2a234f]">
                  F
                </div>
                <span className="font-semibold text-white">
                  Family Finance
                </span>
              </div>

              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setIsNavigationOpen(false)}
                className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-1.5">
              {navigationItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsNavigationOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-white text-[#2a234f]"
                        : "text-white/70 hover:bg-white/10 hover:text-white"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default MobileHeader;
