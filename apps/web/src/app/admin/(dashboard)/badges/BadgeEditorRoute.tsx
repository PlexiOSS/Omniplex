"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BadgeCatalogEntry, BadgeRuleKind } from "@/lib/arcadia/types";
import { useAdmin } from "../../AdminContext";
import { BadgeEditModal } from "./BadgeEditModal";

export function BadgeEditorRoute({ id }: { id?: string }) {
  const { loginToken } = useAdmin();
  const router = useRouter();
  const [target, setTarget] = useState<BadgeCatalogEntry | null | undefined>(
    undefined,
  );
  const [ruleKinds, setRuleKinds] = useState<BadgeRuleKind[]>([]);
  const [otherLinked, setOtherLinked] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, kinds] = await Promise.all([
        arcadia.badges.list(loginToken),
        arcadia.badges.ruleKinds(loginToken).catch(() => []),
      ]);
      setRuleKinds(kinds);
      setOtherLinked(list.filter((b) => b.linked_role && b.id !== id).length);
      if (!id) return setTarget(null);
      const found = list.find((b) => b.id === id);
      if (!found) throw new Error("missing");
      setTarget(found);
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : err instanceof Error && err.message === "missing"
            ? "That badge doesn't exist."
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
    <BadgeEditModal
      loginToken={loginToken}
      badge={target ?? undefined}
      ruleKinds={ruleKinds}
      otherLinkedCount={otherLinked}
      onClose={() => router.push("/admin/badges")}
      onSaved={() => {}}
    />
  );
}
