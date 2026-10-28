"use client";

import { ChevronDown, Shuffle } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { bots, servers } from "@/lib/api";
import type { IndexBot, IndexServer } from "@/lib/api/types";

type Tab = {
  key: string;
  label: string;
  bots: IndexBot[];
  servers: IndexServer[];
};

const RANDOM_KEY = "__random__";
const ENTITY_STORAGE_KEY = "omniplex:home-entity";

type Entity = "bots" | "servers";

const entityListeners = new Set<() => void>();

function readEntity(): Entity {
  try {
    return localStorage.getItem(ENTITY_STORAGE_KEY) === "servers"
      ? "servers"
      : "bots";
  } catch {
    return "bots";
  }
}

function writeEntity(entity: Entity) {
  try {
    localStorage.setItem(ENTITY_STORAGE_KEY, entity);
  } catch {}
  for (const listener of entityListeners) listener();
}

function subscribeEntity(listener: () => void) {
  entityListeners.add(listener);
  return () => {
    entityListeners.delete(listener);
  };
}

interface HomeTabsProps {
  tabs: Tab[];
  /** Adds a "Random" tab that re-rolls from Popplio's @random endpoints
   * client-side — doesn't make sense on a fixed set like Certified/Premium,
   * so it's opt-in. */
  showRandom?: boolean;
  centerLastRow?: boolean;
}

export function HomeTabs({
  tabs,
  showRandom = false,
  centerLastRow = false,
}: HomeTabsProps) {
  const [active, setActive] = useState(tabs[0]?.key ?? "");
  const entity = useSyncExternalStore(
    subscribeEntity,
    readEntity,
    () => "bots" as const,
  );
  const setEntity = writeEntity;
  const showTabStrip = tabs.length > 1 || showRandom;
  const [randomBots, setRandomBots] = useState<IndexBot[] | null>(null);
  const [randomServers, setRandomServers] = useState<IndexServer[] | null>(
    null,
  );
  const [randomLoading, setRandomLoading] = useState(false);

  const isRandom = active === RANDOM_KEY;

  function shuffle() {
    setRandomLoading(true);
    const request =
      entity === "bots"
        ? bots.getRandom().then((res) => setRandomBots(res.bots))
        : servers.getRandom().then((res) => setRandomServers(res.servers));
    request
      .catch(() =>
        entity === "bots" ? setRandomBots([]) : setRandomServers([]),
      )
      .finally(() => setRandomLoading(false));
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-roll when the random tab/entity combination changes, not on every render
  useEffect(() => {
    if (isRandom) shuffle();
  }, [isRandom, entity]);

  const visibleTabs = tabs.filter(
    (t) => (entity === "bots" ? t.bots : t.servers).length > 0,
  );
  const activeKey = isRandom
    ? RANDOM_KEY
    : visibleTabs.some((t) => t.key === active)
      ? active
      : (visibleTabs[0]?.key ?? "");
  const current = visibleTabs.find((t) => t.key === activeKey);
  const items = isRandom
    ? entity === "bots"
      ? (randomBots ?? [])
      : (randomServers ?? [])
    : entity === "bots"
      ? (current?.bots ?? [])
      : (current?.servers ?? []);

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-zinc-200 pb-3 dark:border-zinc-800">
        <div className="min-w-0 flex-1">
          {showTabStrip && (
            <>
              <div className="relative w-full max-w-48 sm:hidden">
                <select
                  value={activeKey}
                  onChange={(e) => setActive(e.target.value)}
                  aria-label="Choose a list"
                  className="h-8 w-full appearance-none truncate rounded-lg border border-zinc-200 bg-white py-0 pr-8 pl-3 text-sm font-medium text-zinc-900 outline-none focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
                >
                  {visibleTabs.map((tab) => (
                    <option key={tab.key} value={tab.key}>
                      {tab.label}
                    </option>
                  ))}
                  {showRandom && <option value={RANDOM_KEY}>Random</option>}
                </select>
                <ChevronDown
                  size={14}
                  className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-zinc-400"
                />
              </div>
              <div className="hidden flex-nowrap items-center gap-1 overflow-x-auto overflow-y-hidden [scrollbar-width:none] sm:flex [&::-webkit-scrollbar]:hidden">
                {visibleTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActive(tab.key)}
                    className={[
                      "shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                      activeKey === tab.key
                        ? "bg-accent/10 text-accent"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                    ].join(" ")}
                  >
                    {tab.label}
                  </button>
                ))}
                {showRandom && (
                  <button
                    type="button"
                    onClick={() => setActive(RANDOM_KEY)}
                    className={[
                      "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors",
                      isRandom
                        ? "bg-accent/10 text-accent"
                        : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                    ].join(" ")}
                  >
                    <Shuffle size={13} />
                    Random
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {isRandom && (
            <button
              type="button"
              onClick={shuffle}
              disabled={randomLoading}
              aria-label="Shuffle again"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <Shuffle
                size={14}
                className={randomLoading ? "animate-pulse" : ""}
              />
            </button>
          )}
          <div className="flex items-center rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">
            {(["bots", "servers"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setEntity(key)}
                className={[
                  "rounded-md px-3 py-1 font-medium capitalize transition-colors",
                  entity === key
                    ? "bg-accent text-accent-fg shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                ].join(" ")}
              >
                {key}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {isRandom && randomLoading && items.length === 0 ? (
        <div className="mt-10 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
          Shuffling…
        </div>
      ) : items.length > 0 ? (
        <div
          className={
            centerLastRow
              ? "mt-6 flex flex-wrap justify-center gap-4 *:w-full sm:*:w-[calc((100%-1rem)/2)] lg:*:w-[calc((100%-2rem)/3)]"
              : "mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          }
        >
          {entity === "bots"
            ? (items as IndexBot[])
                .slice(0, 9)
                .map((bot) => <BotCard key={bot.bot_id} bot={bot} />)
            : (items as IndexServer[])
                .slice(0, 9)
                .map((server) => (
                  <ServerCard key={server.server_id} server={server} />
                ))}
        </div>
      ) : (
        <div className="mt-10 flex items-center justify-center text-sm text-zinc-400 dark:text-zinc-600">
          No {entity} in this section yet.
        </div>
      )}
    </div>
  );
}
