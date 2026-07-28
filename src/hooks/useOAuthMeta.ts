"use client";

import useSWR from "swr";
import { auth } from "@/lib/api";

export function useOAuthMeta() {
  return useSWR("oauth-meta", () => auth.getOAuthMeta(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
