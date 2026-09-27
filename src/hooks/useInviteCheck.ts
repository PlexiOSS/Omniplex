"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { analyzeInvite } from "@/lib/noadmin";
import {
  isDiscordAuthorizeUrl,
  readInvitePermissions,
} from "@/lib/utils/invitePermissions";

export function useInviteCheck(invite: string) {
  const trimmed = invite.trim();
  const [debounced, setDebounced] = useState(trimmed);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(trimmed), 400);
    return () => clearTimeout(t);
  }, [trimmed]);

  const local = readInvitePermissions(trimmed);
  const settled = debounced === trimmed;
  const { data } = useSWR(
    settled && local && !local.administrator ? ["noadmin", debounced] : null,
    ([, input]: [string, string]) => analyzeInvite(input),
    { revalidateOnFocus: false, shouldRetryOnError: false },
  );

  return {
    local,
    report: settled && data?.valid ? data : null,
    isDiscordInvite: isDiscordAuthorizeUrl(trimmed),
  };
}
