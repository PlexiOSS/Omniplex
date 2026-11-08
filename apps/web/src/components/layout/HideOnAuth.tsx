"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function isAuthPath(pathname: string) {
  return pathname === "/auth" || pathname.startsWith("/auth/");
}

export function HideOnAuth({ children }: { children: ReactNode }) {
  return isAuthPath(usePathname()) ? null : children;
}
