"use client";

import { CornerDownLeft, Search, Tag, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { search } from "@/lib/api";
import { BOT_TAGS, SERVER_TAGS } from "@/lib/constants/tags";
import { botPath, mirroredAvatarUrl, serverPath } from "@/lib/utils/assets";
import { formatCountLabel } from "@/lib/utils/format";

interface Item {
  key: string;
  href: string;
  label: string;
  hint?: string;
  avatar?: string;
  kind: "bot" | "server" | "tag" | "all";
}

const DEBOUNCE_MS = 200;
const BOT_LIMIT = 5;
const SERVER_LIMIT = 3;

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
  );
}

export function SearchPalette() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const scope: "bot" | "server" | null = pathname.startsWith("/bots")
    ? "bot"
    : pathname.startsWith("/servers")
      ? "server"
      : null;

  const close = useCallback(() => {
    setOpen(false);
    setInput("");
    setQuery("");
    setSelected(0);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "/" && !isTypingTarget(e.target)) {
        e.preventDefault();
        setOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(input.trim());
      setSelected(0);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input]);

  const types = scope ? [scope] : ["bot", "server"];
  const { data, isLoading } = useSWR(
    open && query ? ["palette", query, types.join(",")] : null,
    () => search.search({ query, target_types: types }),
    { keepPreviousData: true },
  );

  const items = useMemo<Item[]>(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    const out: Item[] = [];
    for (const bot of (data?.bots ?? []).slice(0, BOT_LIMIT)) {
      out.push({
        key: `bot-${bot.bot_id}`,
        href: botPath(bot.bot_id, bot.vanity),
        label: bot.user?.username ?? bot.bot_id,
        hint: formatCountLabel(bot.approximate_votes, "vote"),
        avatar: mirroredAvatarUrl("bots", bot.bot_id, bot.user?.avatar),
        kind: "bot",
      });
    }
    for (const server of (data?.servers ?? []).slice(0, SERVER_LIMIT)) {
      out.push({
        key: `server-${server.server_id}`,
        href: serverPath(server.server_id, server.vanity),
        label: server.name,
        hint: formatCountLabel(server.total_members, "member"),
        avatar: mirroredAvatarUrl("servers", server.server_id, server.avatar),
        kind: "server",
      });
    }
    const tagPool = scope === "server" ? SERVER_TAGS : BOT_TAGS;
    for (const tag of tagPool
      .filter((t) => t.toLowerCase().includes(lower))
      .slice(0, 3)) {
      out.push({
        key: `tag-${tag}`,
        href: `/tags/${encodeURIComponent(tag)}`,
        label: tag,
        hint: "Tag",
        kind: "tag",
      });
    }
    const typeParam = scope ? `&type=${scope}` : "";
    out.push({
      key: "all",
      href: `/search?q=${encodeURIComponent(query)}${typeParam}`,
      label: `See all results for "${query}"`,
      kind: "all",
    });
    return out;
  }, [data, query, scope]);

  function go(item: Item | undefined) {
    if (!item) return;
    close();
    router.push(item.href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, Math.max(items.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items.length > 0) {
        go(items[selected]);
      } else if (input.trim()) {
        go({
          key: "all",
          href: `/search?q=${encodeURIComponent(input.trim())}`,
          label: "",
          kind: "all",
        });
      }
    } else if (e.key === "Escape") {
      close();
    }
  }

  const placeholder =
    scope === "bot"
      ? "Search bots"
      : scope === "server"
        ? "Search servers"
        : "Search bots and servers";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 items-center gap-2 rounded-lg px-2.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      >
        <Search size={16} />
        <kbd className="hidden rounded border border-zinc-200 px-1.5 py-0.5 font-sans text-[10px] font-medium text-zinc-400 lg:inline dark:border-zinc-700 dark:text-zinc-500">
          Ctrl K
        </kbd>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]">
          <button
            type="button"
            aria-label="Close search"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 cursor-default bg-zinc-950/40 backdrop-blur-sm"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search"
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-center gap-3 border-b border-zinc-200 px-4 dark:border-zinc-800">
              <Search size={16} className="shrink-0 text-zinc-400" />
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKey}
                placeholder={placeholder}
                aria-label={placeholder}
                className="h-12 w-full bg-transparent text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-50"
              />
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="shrink-0 rounded-md p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:rounded sm:border sm:border-zinc-200 sm:px-1.5 sm:py-0.5 sm:dark:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <X size={16} className="sm:hidden" />
                <kbd className="hidden font-sans text-[10px] sm:inline">
                  Esc
                </kbd>
              </button>
            </div>

            {query ? (
              <ul className="max-h-[50vh] overflow-y-auto p-2">
                {isLoading && items.length <= 1 && (
                  <li className="px-3 py-2 text-sm text-zinc-400">
                    Searching…
                  </li>
                )}
                {!isLoading && items.length === 1 && (
                  <li className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">
                    No quick matches.
                  </li>
                )}
                {items.map((item, i) => (
                  <li key={item.key}>
                    <button
                      type="button"
                      onMouseEnter={() => setSelected(i)}
                      onClick={() => go(item)}
                      className={[
                        "flex w-full min-w-0 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                        i === selected
                          ? "bg-accent/10 text-accent"
                          : "text-zinc-700 dark:text-zinc-300",
                      ].join(" ")}
                    >
                      {item.avatar ? (
                        <Avatar src={item.avatar} alt={item.label} size={24} />
                      ) : item.kind === "tag" ? (
                        <Tag size={16} className="shrink-0 text-zinc-400" />
                      ) : (
                        <Search size={16} className="shrink-0 text-zinc-400" />
                      )}
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {item.label}
                      </span>
                      {item.hint && (
                        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                          {item.hint}
                        </span>
                      )}
                      {i === selected && (
                        <CornerDownLeft
                          size={14}
                          className="shrink-0 opacity-60"
                        />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Type a name, ID, vanity URL or tag.
                <span className="hidden sm:inline">
                  {" "}
                  Press{" "}
                  <kbd className="rounded border border-zinc-200 px-1 text-xs dark:border-zinc-700">
                    /
                  </kbd>{" "}
                  or{" "}
                  <kbd className="rounded border border-zinc-200 px-1 text-xs dark:border-zinc-700">
                    Ctrl K
                  </kbd>{" "}
                  anywhere to open this.
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
