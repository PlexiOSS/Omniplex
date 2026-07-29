"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

/**
 * Redirects to /auth/login if the user isn't signed in once the session has
 * finished loading, stashing the current path so /auth/sauron can send them
 * back here after they authenticate. Returns the same shape as useAuth so
 * pages can render a loading state while `loading` or the redirect is pending.
 */
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
