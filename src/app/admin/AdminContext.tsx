"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useArcadiaAuth } from "@/hooks/useArcadiaAuth";
import { ArcadiaError, arcadia, isSessionInvalid } from "@/lib/arcadia/client";
import { clearArcadiaSession } from "@/lib/arcadia/session";
import type { CoreConstants, StaffMember } from "@/lib/arcadia/types";
import { hasPermString } from "@/lib/permissions";

interface AdminContextValue {
  loginToken: string;
  staffMember: StaffMember;
  coreConstants: CoreConstants;
  warnings: string[];
  hasPerm: (perm: string) => boolean;
  refresh: () => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within the /admin layout");
  return ctx;
}

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading, logout: clearAuth } = useArcadiaAuth();
  const router = useRouter();

  const [data, setData] = useState<{
    staffMember: StaffMember;
    coreConstants: CoreConstants;
    warnings: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const hello = await arcadia.hello(session.login_token);
      setData({
        staffMember: hello.staff_member,
        coreConstants: hello.core_constants,
        warnings: hello.instance_config.warnings,
      });
    } catch (err) {
      if (isSessionInvalid(err)) {
        clearArcadiaSession();
        router.replace("/admin/login");
        return;
      }
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load staff panel.",
      );
    }
  }, [session, router]);

  useEffect(() => {
    if (!authLoading && !session) {
      router.replace("/admin/login");
      return;
    }
    load();
  }, [authLoading, session, router, load]);

  if (authLoading || (!data && !error)) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  if (error || !session || !data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-24 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
        <button
          type="button"
          onClick={load}
          className="mt-3 text-sm text-accent underline underline-offset-2"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <AdminContext.Provider
      value={{
        loginToken: session.login_token,
        staffMember: data.staffMember,
        coreConstants: data.coreConstants,
        warnings: data.warnings,
        hasPerm: (perm: string) =>
          hasPermString(data.staffMember.resolved_perms, perm),
        refresh: load,
        logout: clearAuth,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}
