import type { Server } from "@omniplex/core/api/types";
import { Button } from "@omniplex/ui/Button";
import { Bot, EyeOff } from "lucide-react";

const GRACE_DAYS = 14;

function daysLeft(since: string) {
  const elapsed = (Date.now() - new Date(since).getTime()) / 86_400_000;
  return Math.max(0, Math.ceil(GRACE_DAYS - elapsed));
}

export function TrackingBotNotice({ server }: { server: Server }) {
  const since = server.tracking_bot_missing_since;
  if (!since) return null;

  const hidden = server.tracking_bot_hidden;
  const left = daysLeft(since);
  const Icon = hidden ? EyeOff : Bot;

  return (
    <div
      className={`mb-6 flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center ${
        hidden
          ? "border-red-200 bg-red-50 dark:border-red-900/60 dark:bg-red-950/30"
          : "border-amber-200 bg-amber-50 dark:border-amber-900/60 dark:bg-amber-950/30"
      }`}
    >
      <div
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
          hidden
            ? "bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-300"
            : "bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300"
        }`}
      >
        <Icon size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-zinc-950 dark:text-zinc-50">
          {hidden
            ? "Hidden from browse and search"
            : "The Omniplex Servers bot isn't in your server"}
        </p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
          {hidden
            ? "The bot has been missing for 14 days. Add it back and your listing shows again within the hour."
            : `Member counts and vote messages have stopped updating. Add the bot back ${
                left > 0 ? `within ${left} day${left === 1 ? "" : "s"}` : "soon"
              } to keep your listing in browse and search.`}
        </p>
      </div>
      {server.tracking_bot_invite_url && (
        <a
          href={server.tracking_bot_invite_url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
        >
          <Button size="sm">Add the bot</Button>
        </a>
      )}
    </div>
  );
}
