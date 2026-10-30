// Copyright (C) 2026 NodeByte LTD

import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./auth";

export async function getServerToken(): Promise<string | undefined> {
  const store = await cookies();
  const value = store.get(SESSION_COOKIE)?.value;
  return value ? decodeURIComponent(value) : undefined;
}
