"use client";

import { ExternalLink } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { ShopItem } from "@/lib/arcadia/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { useAdmin } from "../../../AdminContext";
import { AdminPageHeader } from "../../../AdminPageHeader";

interface ShopPurchase {
  id: string;
  target_type: string;
  target_id: string;
  item_id: string;
  cents: number;
  created_at: string;
}

const ENTITY_PATH: Record<string, string> = {
  bot: "/bots",
  server: "/servers",
  pack: "/packs",
  team: "/teams",
};

export default function ShopPurchasesPage() {
  const { loginToken } = useAdmin();

  const [purchases, setPurchases] = useState<ShopPurchase[] | null>(null);
  const [items, setItems] = useState<ShopItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ json }, itemList] = await Promise.all([
        arcadia.popplioStaff<{ items: ShopPurchase[] }>(
          loginToken,
          "GET",
          "/staff/shop-purchases",
        ),
        arcadia.shopItems.list(loginToken),
      ]);
      setPurchases(json?.items ?? []);
      setItems(itemList);
    } catch (err) {
      setError(
        err instanceof ArcadiaError
          ? err.message
          : "Failed to load shop purchases.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  const itemName = (id: string) => items.find((i) => i.id === id)?.name ?? id;

  if (error && !purchases) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center"><p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!purchases) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-24"><div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Shop Purchases"
        description="The most recent 100 purchases across every entity, platform-wide — for abuse and fraud monitoring, not day-to-day shop management."
      />

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {purchases.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
          No purchases yet.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-150 border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800">
                <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">
                  Item
                </th>
                <th className="py-2 px-4 text-left font-medium text-zinc-500 dark:text-zinc-400">
                  Target
                </th>
                <th className="py-2 px-4 text-right font-medium text-zinc-500 dark:text-zinc-400">
                  Cost
                </th>
                <th className="py-2 pl-4 text-right font-medium text-zinc-500 dark:text-zinc-400">
                  When
                </th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => {
                const basePath = ENTITY_PATH[purchase.target_type];
                return (
                  <tr
                    key={purchase.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="py-2.5 pr-4 font-medium text-zinc-950 dark:text-zinc-50">
                      {itemName(purchase.item_id)}
                    </td>
                    <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-400">
                      <div className="flex items-center gap-1.5">
                        <Badge>{purchase.target_type}</Badge>
                        {basePath ? (
                          <a
                            href={`${basePath}/${purchase.target_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-accent"
                          >
                            {purchase.target_id}
                            <ExternalLink size={11} className="shrink-0" />
                          </a>
                        ) : (
                          purchase.target_id
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-400">
                      {(purchase.cents / 100).toFixed(2)}
                    </td>
                    <td className="py-2.5 pl-4 text-right text-xs text-zinc-400 dark:text-zinc-600">
                      {formatRelativeTime(purchase.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
