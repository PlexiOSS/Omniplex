"use client";

// Copyright (C) 2026 NodeByte LTD

import { auth } from "@omniplex/core/api";
import useSWR from "swr";

export function useOAuthMeta() {
  return useSWR("oauth-meta", () => auth.getOAuthMeta(), {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
