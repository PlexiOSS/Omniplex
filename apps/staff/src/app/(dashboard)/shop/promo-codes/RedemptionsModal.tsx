"use client";

import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Modal } from "@omniplex/ui/Modal";
import { useEffect, useState } from "react";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PlatformUser,
  PromoCode,
  PromoCodeRedemption,
} from "@/lib/arcadia/types";

const STATUS: Record<string, { label: string; cls: string }> = {
  completed: {
    label: "Paid",
    cls: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  pending: {
    label: "At checkout",
    cls: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  abandoned: {
    label: "Abandoned",
    cls: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
  },
};

const PRODUCTS: Record<string, string> = {
  premium: "Premium",
  autovote: "Auto-vote",
};

export function RedemptionsModal({
  promo,
  loginToken,
  onClose,
}: {
  promo: PromoCode;
  loginToken: string;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<PromoCodeRedemption[] | null>(null);
  const [users, setUsers] = useState<Record<string, PlatformUser>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    arcadia.promoCodes
      .redemptions(loginToken, promo.id)
      .then(async (list) => {
        if (cancelled) return;
        setRows(list);
        const ids = [...new Set(list.map((r) => r.user_id))];
        const fetched = await Promise.all(
          ids.map((id) => arcadia.getUser(loginToken, id).catch(() => null)),
        );
        if (cancelled) return;
        setUsers(
          Object.fromEntries(
            fetched.filter((u): u is PlatformUser => !!u).map((u) => [u.id, u]),
          ),
        );
      })
      .catch((err) =>
        setError(
          err instanceof ArcadiaError
            ? err.message
            : "Couldn't load redemptions.",
        ),
      );
    return () => {
      cancelled = true;
    };
  }, [loginToken, promo.id]);

  return (
    <Modal open onClose={onClose} title={`Who used ${promo.code}`}>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : !rows ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nobody has used this code yet.
        </p>
      ) : (
        <ul className="-mx-1 max-h-[60vh] divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
          {rows.map((r) => {
            const user = users[r.user_id];
            const s = STATUS[r.status] ?? STATUS.abandoned;
            return (
              <li
                key={`${r.user_id}-${r.created_at}`}
                className="flex items-center gap-3 px-1 py-2.5"
              >
                <Avatar
                  src={user?.avatar ?? ""}
                  alt={user?.username ?? r.user_id}
                  size={28}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {user?.display_name || user?.username || r.user_id}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {PRODUCTS[r.product] ?? r.product} ·{" "}
                    {formatRelativeTime(r.completed_at ?? r.created_at)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${s.cls}`}
                >
                  {s.label}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
