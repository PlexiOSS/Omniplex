"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { staff } from "@/lib/api";
import type { PermissionData } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { StaffPosition } from "@/lib/arcadia/types";
import { useAdmin } from "../../../AdminContext";
import { PositionEditModal } from "./PositionEditModal";

export function PositionEditorRoute({ id }: { id?: string }) {
  const { loginToken, staffMember } = useAdmin();
  const router = useRouter();
  const [target, setTarget] = useState<StaffPosition | null | undefined>(
    undefined,
  );
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [nextIndex, setNextIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, cat] = await Promise.all([
        arcadia.staffPositions.list(loginToken),
        staff.getPermissionCatalog(),
      ]);
      setCatalog(cat.perms);
      setNextIndex(
        list.length > 0 ? Math.max(...list.map((p) => p.index)) + 1 : 0,
      );
      if (!id) return setTarget(null);
      const found = list.find((p) => p.id === id);
      if (!found) throw new Error("missing");
      setTarget(found);
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : err instanceof Error && err.message === "missing"
            ? "That position doesn't exist."
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
    <PositionEditModal
      loginToken={loginToken}
      position={target ?? undefined}
      granterPerms={staffMember.resolved_perms}
      catalog={catalog}
      defaultIndex={nextIndex}
      onClose={() => router.push("/admin/staff/positions")}
      onSaved={() => {}}
    />
  );
}
