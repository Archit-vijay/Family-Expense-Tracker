import { Menu } from "lucide-react";

function MobileHeader() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:hidden">
      <button
        type="button"
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100"
      >
        <Menu size={22} />
      </button>

      <h1 className="text-lg font-semibold text-gray-900">
        Family Tracker
      </h1>

      <div className="h-8 w-8 rounded-full bg-gray-200" />
    </header>
  );
}

export default MobileHeader;