"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Partner, PartnerType, PlatformUser } from "@/lib/arcadia/types";
import { Avatar } from "@/components/ui/Avatar";
import { partnerAvatarUrl } from "@/lib/utils/assets";
import { AdminPageHeader } from "../../AdminPageHeader";
import { useAdmin } from "../../AdminContext";
import { PartnerEditModal } from "./PartnerEditModal";

export default function PartnersAdminPage() {
  const { loginToken, hasPerm } = useAdmin();

  const [partners, setPartners] = useState<Partner[] | null>(null);
  const [partnerTypes, setPartnerTypes] = useState<PartnerType[]>([]);
  const [owners, setOwners] = useState<Record<string, PlatformUser>>({});
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Partner | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await arcadia.partners.list(loginToken);
      setPartners(res.partners);
      setPartnerTypes(res.partner_types);
      const uniqueIds = [...new Set(res.partners.map((p) => p.user_id))];
      const resolved = await Promise.all(
        uniqueIds.map((id) => arcadia.getUser(loginToken, id).catch(() => null)),
      );
      setOwners(
        Object.fromEntries(
          uniqueIds
            .map((id, i) => [id, resolved[i]] as const)
            .filter((entry): entry is [string, PlatformUser] => !!entry[1]),
        ),
      );
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load partners.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeleting(id);
    arcadia.partners
      .delete(loginToken, id)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeleting(null));
  }

  if (error && !partners) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center"><p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!partners) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Partners"
        description="Featured partners shown across the site."
        action={
          hasPerm("manage_partners") &&
          partnerTypes.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => setEditing("new")}>
              <Plus size={14} />
              New Partner
            </Button>
          )
        }
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      {partnerTypes.length === 0 && (
        <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
          No partner types exist yet — a partner type has to be created
          (directly in the database) before a partner can be added here.
        </p>
      )}

      <div className="mt-6 space-y-2">
        {partners.length === 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No partners yet.
          </p>
        )}
        {partners.map((partner) => {
          const owner = owners[partner.user_id];
          return (
          <div
            key={partner.id}
            className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
          >
            <Avatar
              src={partnerAvatarUrl(partner.id)}
              alt={partner.name}
              size={40}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {partner.name}
                </span>
                <Badge>{partner.type}</Badge>
              </div>
              <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {partner.short}
              </p>
              <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                {partner.links.length} link
                {partner.links.length === 1 ? "" : "s"} · Owner:{" "}
                {owner?.username ?? partner.user_id}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {hasPerm("manage_partners") && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(partner)}
                  >
                    <Pencil size={12} />
                  </Button>
                  <Button
                    variant={
                      confirmDeleteId === partner.id ? "danger" : "ghost"
                    }
                    size="sm"
                    loading={deleting === partner.id}
                    onClick={() => handleDeleteClick(partner.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </>
              )}
            </div>
          </div>
          );
        })}
      </div>

      {editing === "new" && (
        <PartnerEditModal
          loginToken={loginToken}
          partnerTypes={partnerTypes}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <PartnerEditModal
          loginToken={loginToken}
          partnerTypes={partnerTypes}
          partner={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
    </div>
  );
}
