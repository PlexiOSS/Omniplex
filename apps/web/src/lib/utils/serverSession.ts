// Copyright (C) 2026 NodeByte LTD

import { SESSION_COOKIE } from "@omniplex/core/utils/auth";
import { cookies } from "next/headers";

export async function getServerToken(): Promise<string | undefined> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value ? decodeURIComponent(value) : undefined;
}
