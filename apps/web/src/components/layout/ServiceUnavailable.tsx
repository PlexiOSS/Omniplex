"use client";

import { OmniplexLogo } from "@/components/ui/OmniplexLogo";

interface ServiceUnavailableProps {
  inline?: boolean;
  onRetry?: () => void;
}

/**
 * ServiceUnavailable component that displays a message indicating that the service is temporarily unavailable.
 * @param {boolean} [inline=false] - If true, the component will be displayed inline within a page.
 * @param {Function} [onRetry] - Optional callback function to handle retry action. If not provided, the page will reload on retry.
 * @returns {JSX.Element} The rendered ServiceUnavailable component.
 */
export function ServiceUnavailable({
  inline = false,
  onRetry,
}: ServiceUnavailableProps) {
  const handleRetry = onRetry ?? (() => window.location.reload());

  return (
    <div
      className={[
        "flex flex-col items-center justify-center text-center",
        inline ? "py-24" : "min-h-[calc(100vh-3.5rem)] py-16",
      ].join(" ")}
    >
      {/* Pulsing logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full animate-ping bg-indigo-500/20" />
        <div className="relative flex items-center justify-center w-16 h-16 bg-white border rounded-full border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <OmniplexLogo size={32} className="text-zinc-950 dark:text-zinc-50" />
        </div>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        We&apos;ll be right back
      </h1>

      <p className="max-w-sm mt-3 text-sm text-zinc-500 dark:text-zinc-400">
        Omniplex is temporarily unavailable. Our team has been notified and
        we&apos;re working to restore service as quickly as possible.
      </p>

      <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-zinc-200 px-3 py-1.5 dark:border-zinc-800">
        <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Service disruption in progress
        </span>
      </div>

      <div className="flex flex-col items-center gap-3 mt-8">
        <button
          type="button"
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-4 text-sm font-medium transition-colors border rounded-lg h-9 border-zinc-200 text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-900"
        >
          {onRetry ? "Try again" : "Refresh page"}
        </button>
        <a
          href="https://status.omniplex.gg"
          className="text-xs transition-colors text-zinc-400 hover:text-zinc-900 dark:text-zinc-600 dark:hover:text-zinc-50"
        >
          View status page →
        </a>
      </div>
    </div>
  );
}
