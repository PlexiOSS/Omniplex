"use client";

import { useOAuthMeta } from "@/hooks/useOAuthMeta";

export function LoginButton() {
  const { data: oauthMeta, isLoading } = useOAuthMeta();

  if (isLoading || !oauthMeta) {
    return (
      <div className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 opacity-50">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        <span className="text-sm font-medium text-white">Loading…</span>
      </div>
    );
  }

  const discordUrl = oauthMeta.url.replace(
    "%REDIRECT_URL%",
    window.location.origin,
  );

  return (
    <a
      href={discordUrl}
      className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      <svg
        width="20"
        height="15"
        viewBox="0 0 20 15"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d="M16.93 1.33A16.46 16.46 0 0 0 12.86.01a.06.06 0 0 0-.07.03c-.18.32-.38.73-.52 1.06a15.21 15.21 0 0 0-4.54 0C7.58.71 7.37.31 7.19 0a.06.06 0 0 0-.07-.03A16.41 16.41 0 0 0 3.05 1.33a.06.06 0 0 0-.03.02C.44 5.26-.27 9.08.08 12.85c0 .02.01.03.03.04a16.57 16.57 0 0 0 4.97 2.5.06.06 0 0 0 .07-.02c.38-.52.72-1.07 1.01-1.65a.06.06 0 0 0-.03-.09 10.9 10.9 0 0 1-1.56-.74.06.06 0 0 1-.01-.1c.1-.08.21-.16.31-.24a.06.06 0 0 1 .06-.01c3.27 1.49 6.82 1.49 10.05 0a.06.06 0 0 1 .06.01c.1.08.2.16.31.24a.06.06 0 0 1 0 .1c-.5.29-1.02.54-1.56.74a.06.06 0 0 0-.03.09c.3.58.64 1.13 1.01 1.65.02.02.04.03.07.02a16.52 16.52 0 0 0 4.98-2.5.06.06 0 0 0 .03-.04c.42-4.33-.7-8.1-2.95-11.5a.05.05 0 0 0-.03-.02ZM6.68 10.53c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2c1 0 1.8.9 1.79 2 0 1.1-.79 2-1.79 2Zm6.62 0c-.98 0-1.79-.9-1.79-2s.79-2 1.79-2c1 0 1.8.9 1.79 2 0 1.1-.78 2-1.79 2Z" />
      </svg>
      Continue with Discord
    </a>
  );
}
