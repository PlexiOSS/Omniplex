"use client";

// Copyright (C) 2026 NodeByte LTD 

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

export function useRequireAuth() {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      localStorage.setItem("auth_redirect", pathname);
      router.replace("/auth/login");
    }
  }, [auth.loading, auth.isAuthenticated, pathname, router]);

  return auth;
}
