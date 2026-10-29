"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ChangelogEntry } from "@/lib/arcadia/types";
import { useAdmin } from "../../AdminContext";
import { ChangelogEditModal } from "./ChangelogEditModal";

export function ChangelogEditorRoute({ id }: { id?: string }) {
  const { loginToken } = useAdmin();
  const router = useRouter();
  const [target, setTarget] = useState<ChangelogEntry | null | undefined>(
    undefined,
  );
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const list = await arcadia.changelog.list(loginToken);
      if (!id) return setTarget(null);
      const found = list.find((e) => e.itag === id);
      if (!found) throw new Error("missing");
      setTarget(found);
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : err instanceof Error && err.message === "missing"
            ? "That changelog entry doesn't exist."
            : "Failed to load.",
      );
    }
  }, [loginToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (target === undefined) return <AdminLoading />;

  return (
    <ChangelogEditModal
      loginToken={loginToken}
      entry={target ?? undefined}
      onClose={() => router.push("/admin/changelog")}
      onSaved={() => {}}
    />
  );
}
