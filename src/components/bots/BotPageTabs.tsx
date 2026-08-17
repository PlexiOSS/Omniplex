"use client";

import { BookOpen, Megaphone, MessageSquare, Terminal } from "lucide-react";
import { useEffect, useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { VoterList } from "@/components/votes/VoterList";
import { useAuth } from "@/hooks/useAuth";
import { teams as teamsApi } from "@/lib/api";
import type { BotChangelog, BotCommand, Review } from "@/lib/api/types";
import { BotChangelogSection } from "./BotChangelogSection";
import { BotCommandsSection } from "./BotCommandsSection";

type Tab = "about" | "commands" | "changelog" | "reviews";

interface BotPageTabsProps {
  botId: string;
  longDescription: string;
  commands: BotCommand[];
  changelogs: BotChangelog[];
  initialReviews: Review[];
}

export function BotPageTabs({
  botId,
  longDescription,
  commands,
  changelogs,
  initialReviews,
}: BotPageTabsProps) {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>("about");
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    if (!session) {
      setCanEdit(false);
      return;
    }
    teamsApi
      .getEntityPerms(session.user_id, "bot", botId)
      .then((data) => setCanEdit(data.perms.includes("edit_bots")))
      .catch(() => setCanEdit(false));
  }, [session, botId]);

  const tabs: {
    key: Tab;
    label: string;
    icon: typeof BookOpen;
    count: number | null;
  }[] = [
    { key: "about", label: "About", icon: BookOpen, count: null },
    {
      key: "commands",
      label: "Commands",
      icon: Terminal,
      count: commands.length,
    },
    {
      key: "changelog",
      label: "Changelog",
      icon: Megaphone,
      count: changelogs.length,
    },
    {
      key: "reviews",
      label: "Reviews",
      icon: MessageSquare,
      count: initialReviews.length,
    },
  ];

  return (
    <div className="mt-8">
      <div className="overflow-x-auto overflow-y-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-nowrap items-center gap-4">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-4 pt-3 text-sm font-medium transition-colors",
                tab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
              {count !== null && count > 0 && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="pt-8">
        {tab === "about" &&
          (longDescription.trim() ? (
            <Markdown
              content={longDescription}
              className="text-sm text-zinc-700 dark:text-zinc-300"
            />
          ) : (
            <p className="text-sm text-zinc-400 dark:text-zinc-600">
              No description provided.
            </p>
          ))}

        {tab === "commands" && (
          <BotCommandsSection
            botId={botId}
            initialCommands={commands}
            canEdit={canEdit}
            token={session?.token}
          />
        )}

        {tab === "changelog" && (
          <BotChangelogSection
            botId={botId}
            initialChangelogs={changelogs}
            canEdit={canEdit}
            token={session?.token}
          />
        )}

        {tab === "reviews" && (
          <div className="space-y-8">
            <ReviewsSection
              targetType="bot"
              targetId={botId}
              initialReviews={initialReviews}
            />
            <VoterList targetType="bot" targetId={botId} />
          </div>
        )}
      </div>
    </div>
  );
}
