"use client";

import { Bot, Package, Server as ServerIcon, Users } from "lucide-react";
import { useState } from "react";
import { BotCard } from "@/components/cards/BotCard";
import { PackCard } from "@/components/cards/PackCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { TeamCard } from "@/components/cards/TeamCard";
import type { BotPack, IndexBot, IndexServer, Team } from "@/lib/api/types";

interface UserEntityTabsProps {
  bots: IndexBot[];
  servers: IndexServer[];
  packs: BotPack[];
  teams: Team[];
}

type EntityKey = "bots" | "servers" | "packs" | "teams";

/** Same underline-tab treatment as the dashboard's own tab bar. */
export function UserEntityTabs({
  bots,
  servers,
  packs,
  teams,
}: UserEntityTabsProps) {
  const allTabs: {
    key: EntityKey;
    label: string;
    count: number;
    icon: typeof Bot;
  }[] = [
    { key: "bots", label: "Bots", count: bots.length, icon: Bot },
    {
      key: "servers",
      label: "Servers",
      count: servers.length,
      icon: ServerIcon,
    },
    { key: "packs", label: "Packs", count: packs.length, icon: Package },
    { key: "teams", label: "Teams", count: teams.length, icon: Users },
  ];
  const tabs = allTabs.filter((t) => t.count > 0);

  const [active, setActive] = useState<EntityKey>(tabs[0]?.key ?? "bots");

  if (tabs.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="overflow-x-auto overflow-y-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-nowrap items-center gap-4">
          {tabs.map(({ key, label, count, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={[
                "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 pt-3 text-sm font-medium transition-colors",
                active === key
                  ? "border-accent text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {active === "bots" &&
          bots.map((bot) => <BotCard key={bot.bot_id} bot={bot} />)}
        {active === "servers" &&
          servers.map((server) => (
            <ServerCard key={server.server_id} server={server} />
          ))}
        {active === "packs" &&
          packs.map((pack) => <PackCard key={pack.url} pack={pack} />)}
        {active === "teams" &&
          teams.map((team) => <TeamCard key={team.id} team={team} />)}
      </div>
    </section>
  );
}
