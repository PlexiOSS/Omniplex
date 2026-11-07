"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormEditor } from "@/app/(dashboard)/applications/forms/FormEditor";
import { useAdmin } from "@/app/AdminContext";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { AppPosition } from "@/lib/arcadia/types";

export default function EditApplicationFormPage() {
  const { id } = useParams<{ id: string }>();
  const { loginToken } = useAdmin();
  const [position, setPosition] = useState<AppPosition | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await arcadia.appPositions.list(loginToken);
      const found = all.find((p) => p.id === id);
      if (!found) setError("That application form doesn't exist.");
      else setPosition(found);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load the form.",
      );
    }
  }, [loginToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <AdminError message={error} onRetry={load} />;
  if (!position) return <AdminLoading />;

  return <FormEditor key={position.id} position={position} />;
}
