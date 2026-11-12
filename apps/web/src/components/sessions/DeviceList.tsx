"use client";

import type { ApiSession } from "@omniplex/core/api/types";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { LogOut, Monitor, Smartphone } from "lucide-react";
import { deviceLabel, parseDevice } from "@/lib/deviceName";

function expiresIn(iso: string): string {
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "expires today";
  if (days === 1) return "expires tomorrow";
  return `expires in ${days} days`;
}

interface DeviceListProps {
  devices: ApiSession[];
  canManage: boolean;
  revokingId: string | null;
  signingOutOthers: boolean;
  onSignOut: (id: string) => void;
  onSignOutOthers: () => void;
}

export function DeviceList({
  devices,
  canManage,
  revokingId,
  signingOutOthers,
  onSignOut,
  onSignOutOthers,
}: DeviceListProps) {
  const sorted = [...devices].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
  const others = sorted.filter((d) => !d.current).length;

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Signed-in devices
          <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">
            {devices.length}
          </span>
        </h3>
        {canManage && others > 0 && sorted[0]?.current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            loading={signingOutOthers}
            onClick={onSignOutOthers}
            className="px-3 text-xs"
          >
            <LogOut size={12} />
            Sign out other devices
          </Button>
        )}
      </div>

      <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {sorted.map((s) => {
          const device = parseDevice(s.name);
          const Icon = device.mobile ? Smartphone : Monitor;
          return (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3">
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  s.current
                    ? "bg-accent/10 text-accent"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                ].join(" ")}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {deviceLabel(device)}
                  </p>
                  {s.current && <Badge variant="success">This device</Badge>}
                </div>
                <p
                  className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400"
                  title={`Signed in ${new Date(s.created_at).toLocaleString()}, expires ${new Date(s.expiry).toLocaleString()}`}
                >
                  Signed in {formatRelativeTime(s.created_at)} ·{" "}
                  {expiresIn(s.expiry)}
                </p>
              </div>
              {canManage && !s.current && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  loading={revokingId === s.id}
                  disabled={signingOutOthers}
                  onClick={() => onSignOut(s.id)}
                  className="shrink-0 px-3 text-xs"
                >
                  <LogOut size={12} />
                  Sign out
                </Button>
              )}
            </li>
          );
        })}
      </ul>
      {sorted[0]?.current && (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          To sign out of this device, use Sign out in your account menu.
        </p>
      )}
    </section>
  );
}
