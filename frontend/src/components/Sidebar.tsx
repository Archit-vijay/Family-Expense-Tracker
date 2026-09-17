import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  PanelLeftClose,
  Settings,
  Users,
  WalletCards,
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";

import { useState } from "react";

import { useAuth } from "../context/AuthContext";

function Sidebar() {
  const { user, familyRole, logout } = useAuth();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] =
    useState(false);

  const [isCollapsed, setIsCollapsed] =
    useState(false);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function toggleSidebar() {
    setIsCollapsed((previous) => !previous);
    setIsUserMenuOpen(false);
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

  return (
    <aside
      className={`z-30 hidden h-full shrink-0 flex-col bg-[#2a234f] text-white transition-[width] duration-300 ease-in-out md:flex ${
        isCollapsed ? "w-20" : "w-72"
      }`}
    >
      {/* Brand */}
      <div
        className={`flex h-20 shrink-0 items-center ${
          isCollapsed
            ? "justify-center px-3"
            : "justify-between px-5"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Logo */}
          {isCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffb3c3] shadow-lg shadow-black/20 transition-all duration-200 hover:scale-105 hover:bg-[#ffc4d0] active:scale-95"
            >
              <span className="text-lg font-bold text-[#2a234f]">
                F
              </span>
            </button>
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ffb3c3] shadow-lg shadow-black/20">
              <span className="text-lg font-bold text-[#2a234f]">
                F
              </span>
            </div>
          )}

          {/* Brand name */}
          <div className="overflow-hidden whitespace-nowrap">
            <div
              className={`transition-all duration-300 ${
                isCollapsed
                  ? "w-0 opacity-0"
                  : "w-auto opacity-100"
              }`}
            >
              <p className="text-sm font-semibold tracking-wide text-white">
                Family
              </p>

              <p className="text-sm font-semibold tracking-wide text-[#ffb3c3]">
                Finance
              </p>
            </div>
          </div>
        </div>

        {/* Collapse button */}
        {!isCollapsed && (
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/50 transition-all duration-200 hover:bg-white/10 hover:text-white"
          >
            <PanelLeftClose size={19} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav
        className={`flex-1 py-5 ${
          isCollapsed ? "px-3" : "px-4"
        }`}
      >
        {/* Overview */}
        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Overview
          </p>
        )}

        <div className="space-y-1.5">
          {/* Dashboard */}
          <NavLink
            to="/dashboard"
            title={isCollapsed ? "Dashboard" : undefined}
            className={({ isActive }) =>
              `group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed
                  ? "justify-center px-3"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                  : "text-white/60 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <LayoutDashboard size={19} />
            {!isCollapsed && <span>Dashboard</span>}
          </NavLink>

          {/* Transactions */}
          <NavLink
            to="/transactions"
            title={isCollapsed ? "Transactions" : undefined}
            className={({ isActive }) =>
              `group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed
                  ? "justify-center px-3"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                  : "text-white/60 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <WalletCards size={19} />
            {!isCollapsed && <span>Transactions</span>}
          </NavLink>

          {/* Budgets */}
          <NavLink
            to="/budgets"
            title={isCollapsed ? "Budgets" : undefined}
            className={({ isActive }) =>
              `group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed
                  ? "justify-center px-3"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                  : "text-white/60 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <BarChart3 size={19} />
            {!isCollapsed && <span>Budgets</span>}
          </NavLink>

          {/* Analytics */}
          <NavLink
            to="/reports"
            title={isCollapsed ? "Analytics" : undefined}
            className={({ isActive }) =>
              `group flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed
                  ? "justify-center px-3"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                  : "text-white/60 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <BarChart3 size={19} />
            {!isCollapsed && <span>Analytics</span>}
          </NavLink>
        </div>

        {/* Family */}
        {!isCollapsed && (
          <p className="mb-3 mt-8 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Family
          </p>
        )}

        {isCollapsed && (
          <div className="my-5 h-px bg-white/10" />
        )}

        <div className="space-y-1.5">
          {/* Family Members */}
          <NavLink
            to="/family"
            title={
              isCollapsed
                ? "Family Members"
                : undefined
            }
            className={({ isActive }) =>
              `flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed
                  ? "justify-center px-3"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                  : "text-white/60 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Users size={19} />
            {!isCollapsed && (
              <span>Family Members</span>
            )}
          </NavLink>

          {/* Settings */}
          <NavLink
            to="/settings"
            title={isCollapsed ? "Settings" : undefined}
            className={({ isActive }) =>
              `flex items-center rounded-xl py-3 text-sm font-medium transition-all duration-200 ${
                isCollapsed
                  ? "justify-center px-3"
                  : "gap-3 px-3.5"
              } ${
                isActive
                  ? "bg-white text-[#2a234f] shadow-lg shadow-black/10"
                  : "text-white/60 hover:translate-x-1 hover:bg-white/5 hover:text-white"
              }`
            }
          >
            <Settings size={19} />
            {!isCollapsed && <span>Settings</span>}
          </NavLink>
        </div>
      </nav>

      {/* User section */}
      <div
        className={`border-t border-white/10 p-4 ${
          isCollapsed ? "px-3" : ""
        }`}
      >
        <div className="relative">
          {/* User button */}
          <button
            type="button"
            onClick={() =>
              setIsUserMenuOpen(
                (previous) => !previous,
              )
            }
            title={
              isCollapsed
                ? user?.name ?? "User"
                : undefined
            }
            className={`flex w-full items-center rounded-xl bg-white/5 p-3 text-left transition-all duration-200 hover:bg-white/10 ${
              isCollapsed
                ? "justify-center"
                : "gap-3"
            }`}
          >
            {/* Avatar */}
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-full
                bg-[#ffb3c3]
                text-sm font-bold
                text-[#2a234f]
              "
            >
              {user?.name
                ?.charAt(0)
                .toUpperCase() ?? "U"}
            </div>

            {/* User information */}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">
                  {user?.name ?? "User"}
                </p>

                <p className="truncate text-xs text-white/40">
                  {getRoleLabel()}
                </p>
              </div>
            )}

            {/* Arrow */}
            {!isCollapsed &&
              (isUserMenuOpen ? (
                <ChevronUp
                  size={18}
                  className="shrink-0 text-[#ffb3c3]"
                />
              ) : (
                <ChevronDown
                  size={18}
                  className="shrink-0 text-white/50"
                />
              ))}
          </button>

          {/* Dropdown */}
          <div
            className={`
              absolute
              z-50
              ${
                isCollapsed
                  ? "bottom-0 left-full ml-3 w-40"
                  : "bottom-full left-0 right-0 mb-2"
              }
              overflow-hidden
              rounded-xl
              border
              border-white/10
              bg-[#211b40]
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
                text-white/70
                transition-colors
                duration-150
                hover:bg-[#ffb3c3]
                hover:text-[#2a234f]
                focus-visible:bg-[#ffb3c3]
                focus-visible:text-[#2a234f]
                focus-visible:outline-none
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