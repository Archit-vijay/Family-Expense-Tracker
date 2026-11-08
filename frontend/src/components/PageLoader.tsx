import { Loader2 } from "lucide-react";

interface PageLoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function PageLoader({
  message = "Loading...",
  fullScreen = true,
}: PageLoaderProps) {
  const containerClasses = fullScreen
    ? "fixed inset-0 z-50 flex items-center justify-center bg-[#F8F7FB]/80 dark:bg-[#0e0a1f]/80 backdrop-blur-xs transition-opacity duration-200"
    : "flex min-h-[320px] w-full items-center justify-center py-12";

  return (
    <div className={containerClasses} role="status" aria-label="Loading page">
      <div className="flex flex-col items-center justify-center gap-3.5 p-6 text-center animate-fade-in">
        {/* Animated Brand Dual Ring Indicator */}
        <div className="relative flex items-center justify-center">
          {/* Subtle outer glow */}
          <div className="absolute h-12 w-12 rounded-full bg-[#FFB3C3]/30 blur-md dark:bg-[#FFB3C3]/15" />
          
          {/* Outer ring */}
          <div className="h-11 w-11 rounded-full border-2 border-[#E8E5EF] dark:border-[#2e265c]" />
          
          {/* Spinning brand accent ring */}
          <Loader2
            size={24}
            className="absolute animate-spin text-[#2A234F] dark:text-[#FFB3C3]"
          />
        </div>

        {/* Brand Caption */}
        <p className="text-xs font-semibold tracking-wider uppercase text-[#77738A] dark:text-[#a09cb4]">
          {message}
        </p>
      </div>
    </div>
  );
}
