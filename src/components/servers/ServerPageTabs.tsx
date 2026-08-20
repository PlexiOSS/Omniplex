"use client";

import { BookOpen, MessageSquare, Smile, Users } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Markdown } from "@/components/markdown/Markdown";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { VoterList } from "@/components/votes/VoterList";
import type { Review, ServerEmoji, ServerSticker } from "@/lib/api/types";
import { EmojiStickerGallery } from "./EmojiStickerGallery";

type Tab = "about" | "emojis" | "reviews" | "voters";

interface ServerPageTabsProps {
  serverId: string;
  longDescription: string;
  showEmojis: boolean;
  emojis: ServerEmoji[];
  stickers: ServerSticker[];
  initialReviews: Review[];
}

const TAB_KEYS: Tab[] = ["about", "emojis", "reviews", "voters"];

export function ServerPageTabs(props: ServerPageTabsProps) {
  return (
    <Suspense fallback={<ServerPageTabsInner {...props} initialTab="about" />}>
      <ServerPageTabsWithSearchParams {...props} />
    </Suspense>
  );
}

function ServerPageTabsWithSearchParams(props: ServerPageTabsProps) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const initialTab: Tab = (TAB_KEYS as string[]).includes(requested ?? "")
    ? (requested as Tab)
    : "about";
  return <ServerPageTabsInner {...props} initialTab={initialTab} />;
}

function ServerPageTabsInner({
  serverId,
  longDescription,
  showEmojis,
  emojis,
  stickers,
  initialReviews,
  initialTab,
}: ServerPageTabsProps & { initialTab: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);

  const hasEmojiTab = showEmojis && (emojis.length > 0 || stickers.length > 0);

  const tabs: {
    key: Tab;
    label: string;
    icon: typeof BookOpen;
    count: number | null;
  }[] = [
    { key: "about", label: "About", icon: BookOpen, count: null },
    ...(hasEmojiTab
      ? [
          {
            key: "emojis" as Tab,
            label: "Emojis & Stickers",
            icon: Smile,
            count: emojis.length + stickers.length,
          },
        ]
      : []),
    {
      key: "reviews",
      label: "Reviews",
      icon: MessageSquare,
      count: initialReviews.length,
    },
    { key: "voters", label: "Voters", icon: Users, count: null },
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

        {tab === "emojis" && hasEmojiTab && (
          <EmojiStickerGallery emojis={emojis} stickers={stickers} noTopBorder />
        )}

        {tab === "reviews" && (
          <ReviewsSection
            targetType="server"
            targetId={serverId}
            initialReviews={initialReviews}
          />
        )}

        {tab === "voters" && (
          <VoterList targetType="server" targetId={serverId} />
        )}
      </div>
    </div>
  );
}
