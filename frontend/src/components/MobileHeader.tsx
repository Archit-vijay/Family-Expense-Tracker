import { Bell, Menu } from "lucide-react";

function MobileHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/85 px-4 backdrop-blur-xl md:hidden">
      <button
        type="button"
        className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-violet-500 to-indigo-600 text-sm font-bold text-white">
          F
        </div>

        <span className="font-semibold text-slate-900">
          Family Finance
        </span>
      </div>

      <button
        type="button"
        className="relative rounded-xl p-2 text-slate-600 transition hover:bg-slate-100"
      >
        <Bell size={20} />

        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-violet-500 ring-2 ring-white" />
      </button>
    </header>
  );
}

export default MobileHeader;