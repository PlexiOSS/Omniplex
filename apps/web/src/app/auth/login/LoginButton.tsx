"use client";

import { useEffect, useState } from "react";
import { DiscordIcon } from "@/components/ui/BrandIcons";
import { useOAuthMeta } from "@/hooks/useOAuthMeta";
import { discordLoginUrl } from "@/lib/loginState";

export function LoginButton() {
  const { data: oauthMeta } = useOAuthMeta();
  const [discordUrl, setDiscordUrl] = useState<string | null>(null);

  useEffect(() => {
    if (oauthMeta) setDiscordUrl(discordLoginUrl(oauthMeta.url));
  }, [oauthMeta]);

  if (!discordUrl) {
    return (
      <div className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 opacity-50">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
        <span className="text-sm font-medium text-white">Loading…</span>
      </div>
    );
  }

  return (
    <a
      href={discordUrl}
      className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      <DiscordIcon size={20} />
      Continue with Discord
    </a>
  );
}
