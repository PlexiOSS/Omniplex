"use client";

import { useState } from "react";
import type { IndexBot } from "@/lib/api/types";
import { BotCard } from "@/components/cards/BotCard";

type Tab = {
  key: string;
  label: string;
  bots: IndexBot[];
};

interface HomeTabsProps {
  tabs: Tab[];
}

export function HomeTabs({ tabs }: HomeTabsProps) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const current = tabs.find((t) => t.key === active);

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={[
              "relative -mb-px border-b-2 px-3 pb-3 pt-1 text-sm font-medium transition-colors",
              active === tab.key
                ? "border-zinc-950 text-zinc-950 dark:border-zinc-50 dark:text-zinc-50"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {current && current.bots.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {current.bots.slice(0, 9).map((bot) => (
            <BotCard key={bot.bot_id} bot={bot} />
          ))}
        </div>
      ) : (
        <div className="mt-10 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
          No bots in this section yet.
        </div>
      )}
    </div>
  );
}
