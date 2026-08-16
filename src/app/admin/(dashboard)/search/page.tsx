"use client";

import { Search as SearchIcon, ShieldOff, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePagination } from "@/hooks/usePagination";
import type { ReviewTargetType } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PartialBot,
  PartialPack,
  PartialServer,
  PartialTeam,
  PartialUser,
  RPCWebAction,
  TargetType,
} from "@/lib/arcadia/types";
import { teamAvatarUrl } from "@/lib/utils/assets";
import { formatCount } from "@/lib/utils/format";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";
import { GenericRpcModal } from "../GenericRpcModal";
import { ReviewsModal } from "../ReviewsModal";

type Result =
  | { kind: "bot"; bot: PartialBot }
  | { kind: "server"; server: PartialServer }
  | { kind: "pack"; pack: PartialPack }
  | { kind: "team"; team: PartialTeam }
  | { kind: "user"; user: PartialUser };

const SEARCH_PAGE_SIZE = 10;

const SEARCHABLE_TYPES: { value: TargetType; label: string }[] = [
  { value: "Bot", label: "Bots" },
  { value: "Server", label: "Servers" },
  { value: "Pack", label: "Packs" },
  { value: "Team", label: "Teams" },
  { value: "User", label: "Users" },
];

/** Reviews only exist for these target types (Popplio's review routes). */
const REVIEWABLE_KINDS = new Set(["bot", "server", "team"]);

interface ResultInfo {
  id: string;
  name: string;
  avatar: string;
  short: string | null;
  badge: string | null;
  votes: number | null;
}

function describeResult(result: Result): ResultInfo {
  switch (result.kind) {
    case "bot":
      return {
        id: result.bot.bot_id,
        name: result.bot.user.username,
        avatar: result.bot.user.avatar,
        short: result.bot.short,
        badge: result.bot.type,
        votes: result.bot.votes,
      };
    case "server":
      return {
        id: result.server.server_id,
        name: result.server.name,
        avatar: result.server.avatar,
        short: result.server.short,
        badge: result.server.type,
        votes: result.server.votes,
      };
    case "pack":
      return {
        id: result.pack.url,
        name: result.pack.name,
        avatar: result.pack.owner.avatar,
        short: result.pack.short,
        badge: result.pack.pack_type,
        votes: result.pack.votes,
      };
    case "team":
      return {
        id: result.team.id,
        name: result.team.name,
        avatar: teamAvatarUrl(result.team.id),
        short: result.team.short || null,
        badge: result.team.vote_banned ? "Vote Banned" : null,
        votes: result.team.votes,
      };
    case "user":
      return {
        id: result.user.user.id,
        name: result.user.user.username,
        avatar: result.user.user.avatar,
        short: null,
        badge: result.user.staff
          ? "Staff"
          : result.user.banned
            ? "Banned"
            : null,
        votes: null,
      };
  }
}

export default function AdminSearchPage() {
  const { loginToken } = useAdmin();
  const [targetType, setTargetType] = useState<TargetType>("Bot");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<Result | null>(null);
  const [actionMethods, setActionMethods] = useState<RPCWebAction[] | null>(
    null,
  );
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [reviewsTarget, setReviewsTarget] = useState<Result | null>(null);

  const { page, setPage, pageItems } = usePagination(
    results ?? [],
    SEARCH_PAGE_SIZE,
  );

  async function runSearch(t: TargetType, q: string) {
    setLoading(true);
    setError(null);
    try {
      const entries = await arcadia.searchEntitys(loginToken, t, q);
      setResults(
        entries.map((e): Result => {
          if ("Bot" in e) return { kind: "bot", bot: e.Bot };
          if ("Server" in e) return { kind: "server", server: e.Server };
          if ("Pack" in e) return { kind: "pack", pack: e.Pack };
          if ("Team" in e) return { kind: "team", team: e.Team };
          return { kind: "user", user: e.User };
        }),
      );
      setPage(1);
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  }

  // An empty query matches everything (ILIKE '%%'), so this pre-fills the
  // page with the full Bot list on load instead of an empty results area —
  // switching the type dropdown re-runs it too.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    runSearch(targetType, query.trim());
  }, [targetType]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    runSearch(targetType, query.trim());
  }

  async function openActions(result: Result) {
    try {
      const methods = await arcadia.getRpcMethods(loginToken, true);
      const filtered = methods.filter((m) =>
        m.supported_target_types.includes(targetType),
      );
      if (filtered.length === 0) {
        setError("No actions available for this entity.");
        return;
      }
      setActionMethods(filtered);
      setActionTarget(result);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load actions.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Search"
        description="Find any bot, server, pack, team, or user by ID or name to take action outside the queue. Starts pre-filled with everything narrow it down as you type."
      />

      <form onSubmit={handleSearch} className="mt-6 flex flex-wrap gap-2">
        <select
          value={targetType}
          onChange={(e) => setTargetType(e.target.value as TargetType)}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
        >
          {SEARCHABLE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ID or name…"
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
        />
        <Button type="submit" variant="primary" loading={loading}>
          <SearchIcon size={14} />
          Search
        </Button>
      </form>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {resultMessage && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {resultMessage}
        </div>
      )}

      {results && (
        <div className="mt-6 space-y-3">
          {results.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldOff
                size={28}
                className="mb-3 text-zinc-300 dark:text-zinc-700"
              />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No results.
              </p>
            </div>
          )}
          {pageItems.map((result) => {
            const info = describeResult(result);

            return (
              <div
                key={info.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <Avatar src={info.avatar} alt={info.name} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {info.name}
                    </span>
                    <Badge variant="default">
                      {result.kind[0].toUpperCase() + result.kind.slice(1)}
                    </Badge>
                    {info.badge && (
                      <Badge
                        variant={
                          info.badge === "Banned" ||
                          info.badge === "Vote Banned"
                            ? "danger"
                            : "default"
                        }
                      >
                        {info.badge}
                      </Badge>
                    )}
                  </div>
                  {info.short && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {info.short}
                    </p>
                  )}
                  {info.votes !== null && (
                    <div className="mt-1.5 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
                      <span className="flex items-center gap-1">
                        <Star size={11} />
                        {formatCount(info.votes)} votes
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-col gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openActions(result)}
                  >
                    Actions
                  </Button>
                  {REVIEWABLE_KINDS.has(result.kind) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReviewsTarget(result)}
                    >
                      Reviews
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={results.length}
            perPage={SEARCH_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {actionTarget && actionMethods && (
        <GenericRpcModal
          loginToken={loginToken}
          targetType={targetType}
          targetId={describeResult(actionTarget).id}
          entityLabel={describeResult(actionTarget).name}
          methods={actionMethods}
          onClose={() => {
            setActionTarget(null);
            setActionMethods(null);
          }}
          onDone={(msg) => msg && setResultMessage(msg)}
        />
      )}

      {reviewsTarget && REVIEWABLE_KINDS.has(reviewsTarget.kind) && (
        <ReviewsModal
          targetType={reviewsTarget.kind as ReviewTargetType}
          targetId={describeResult(reviewsTarget).id}
          entityLabel={describeResult(reviewsTarget).name}
          onClose={() => setReviewsTarget(null)}
        />
      )}
    </div>
  );
}
