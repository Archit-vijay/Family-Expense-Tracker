import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useState } from "react";

import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }
  return (
    <aside className="hidden h-full w-72 shrink-0 flex-col bg-[#111827] text-white md:flex">
      {/* Brand */}
      <div className="flex h-20 items-center px-7">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-500 to-indigo-600 shadow-lg shadow-indigo-950/30">
            <span className="text-lg font-bold">F</span>
          </div>

          <div>
            <p className="text-sm font-semibold tracking-wide text-white">
              Family
            </p>
            <p className="text-sm font-semibold tracking-wide text-slate-400">
              Finance
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-5">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Overview
        </p>

        <div className="space-y-1.5">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                  : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={19} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink
            to="/transactions"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                  : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <WalletCards size={19} />
            <span>Transactions</span>
          </NavLink>

          <NavLink
            to="/budgets"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                  : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <BarChart3 size={19} />
            <span>Budgets</span>
          </NavLink>

          <NavLink
            to="/reports"
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                  : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <BarChart3 size={19} />
            <span>Analytics</span>
          </NavLink>
        </div>

        <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
          Family
        </p>

        <div className="space-y-1.5">
          <NavLink
            to="/family"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                  : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Users size={19} />
            <span>Family Members</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-white text-slate-900 shadow-lg shadow-black/10"
                  : "text-slate-400 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Settings size={19} />
            <span>Settings</span>
          </NavLink>
        </div>
      </nav>

      {/* User section */}
<div className="border-t border-white/10 p-4">
  <div className="relative">
    {/* User button */}
    <button
      type="button"
      onClick={() =>
        setIsUserMenuOpen((previous) => !previous)
      }
      className="
        flex w-full items-center gap-3
        rounded-xl
        bg-white/5
        p-3
        text-left
        transition-all duration-200
        hover:bg-white/10
      "
    >
      {/* Avatar */}
      <div
        className="
          flex h-10 w-10 shrink-0
          items-center justify-center
          rounded-full
          bg-linear-to-br
          from-violet-400
          to-indigo-500
          text-sm font-bold
          text-white
        "
      >
        {user?.name?.charAt(0).toUpperCase() ?? "U"}
      </div>

      {/* User information */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-white">
          {user?.name ?? "User"}
        </p>

        <p className="truncate text-xs text-slate-500">
          Family Admin
        </p>
      </div>

      {/* Arrow */}
      {isUserMenuOpen ? (
        <ChevronUp
          size={18}
          className="shrink-0 text-slate-400"
        />
      ) : (
        <ChevronDown
          size={18}
          className="shrink-0 text-slate-400"
        />
      )}
    </button>

    {/* Dropdown */}
    <div
  className={`
    absolute
    bottom-full
    left-0
    right-0
    mb-2
    overflow-hidden
    rounded-xl
    border
    border-white/10
    bg-[#1a2333]
    p-1
    shadow-2xl
    shadow-black/30
    transition-all
    duration-200
    ease-out
    ${
      isUserMenuOpen
        ? "translate-y-0 scale-100 opacity-100"
        : "pointer-events-none translate-y-2 scale-[0.98] opacity-0"
    }
  `}
  aria-hidden={!isUserMenuOpen}
>
  <button
    type="button"
    onClick={handleLogout}
    className="
      flex w-full
      items-center
      rounded-lg
      px-3 py-2.5
      text-sm
      font-medium
      text-slate-300
      transition-colors
      duration-150
      hover:bg-white/10
      hover:text-white
    "
  >
    Sign out
  </button>
</div>
  </div>
</div>
    </aside>
  );
}

export default Sidebar;