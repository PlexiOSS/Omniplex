"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { search } from "@/lib/api";
import type { IndexBot, IndexServer } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

type PickerResult = { id: string; name: string; avatarSrc: string };

interface ComparePickerProps {
  targetType: "bot" | "server";
  /** Which query param this picker fills in — `a` or `b`. */
  paramName: "a" | "b";
  placeholder: string;
}

function toResults(
  targetType: "bot" | "server",
  bots: IndexBot[] | undefined,
  servers: IndexServer[] | undefined,
): PickerResult[] {
  if (targetType === "bot") {
    return (bots ?? []).map((bot) => ({
      id: bot.bot_id,
      name: bot.user.username,
      avatarSrc: mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar),
    }));
  }
  return (servers ?? []).map((srv) => ({
    id: srv.server_id,
    name: srv.name,
    avatarSrc: mirroredAvatarUrl("servers", srv.server_id, srv.avatar),
  }));
}

/** Debounced type-to-search dropdown for filling in one side of a compare
 * page — reuses the existing `/list/search` endpoint, no new backend work. */
export function ComparePicker({
  targetType,
  paramName,
  placeholder,
}: ComparePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  useEffect(() => {
    clearTimeout(debounceRef.current);
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    debounceRef.current = setTimeout(() => {
      search
        .search({ query: trimmed, target_types: [targetType] })
        .then((res) => setResults(toResults(targetType, res.bots, res.servers)))
        .catch(() => setResults([]))
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, targetType]);

  const select = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, id);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="rounded-xl border border-dashed border-zinc-300 p-4 dark:border-zinc-700">
      <Input
        icon={<Search size={14} />}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {isLoading && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
          Searching…
        </p>
      )}
      {!isLoading && results.length > 0 && (
        <div className="mt-3 space-y-1">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => select(result.id)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
            >
              <Avatar src={result.avatarSrc} alt={result.name} size={24} />
              <span className="truncate text-sm text-zinc-950 dark:text-zinc-50">
                {result.name}
              </span>
            </button>
          ))}
        </div>
      )}
      {!isLoading && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
          No {targetType === "bot" ? "bots" : "servers"} found.
        </p>
      )}
    </div>
  );
}
