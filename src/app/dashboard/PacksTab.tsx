"use client";

import { ArrowUpRight, Coins, Package, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { VoteCreditsPanel } from "@/components/votes/VoteCreditsPanel";
import { packs } from "@/lib/api";
import type { BotPack, IndexBot } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";
import { EmojiStickerPackEditModal } from "./EmojiStickerPackEditModal";
import { PackEditModal } from "./PackEditModal";

function PackItem({
  pack,
  userId,
  userBots,
  token,
  mutate,
}: {
  pack: BotPack;
  userId: string;
  userBots: IndexBot[];
  token: string;
  mutate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [showCredits, setShowCredits] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    packs
      .deletePack(userId, pack.url, token)
      .then(() => mutate())
      .catch(() => setDeleting(false));
  }

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex -space-x-2">
        {(pack.bots ?? []).length > 0
          ? (pack.bots ?? [])
              .slice(0, 4)
              .map((bot) => (
                <Avatar
                  key={bot.bot_id}
                  src={bot.user.avatar}
                  alt={bot.user.username}
                  size={32}
                  className="ring-2 ring-white dark:ring-zinc-900"
                />
              ))
          : (pack.servers ?? [])
              .slice(0, 4)
              .map((server) => (
                <Avatar
                  key={server.server_id}
                  src={
                    server.avatar ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`
                  }
                  alt={server.name}
                  size={32}
                  className="ring-2 ring-white dark:ring-zinc-900"
                />
              ))}
      </div>

      <p className="mt-3 truncate font-semibold text-zinc-950 dark:text-zinc-50">
        {pack.name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
        {pack.short}
      </p>

      {pack.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {pack.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{formatCount(pack.votes)} votes</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/packs/${pack.url}`}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            View
            <ArrowUpRight size={11} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="h-7 px-2 text-xs"
          >
            <Pencil size={12} />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCredits(true)}
            className="h-7 px-2 text-xs"
          >
            <Coins size={12} />
            Credits
          </Button>
          <Button
            variant={confirming ? "danger" : "ghost"}
            size="sm"
            loading={deleting}
            onClick={handleDeleteClick}
            className="h-7 px-2 text-xs"
          >
            <Trash2 size={12} />
            {confirming ? "Confirm?" : "Delete"}
          </Button>
        </div>
      </div>

      {editing &&
        (pack.pack_type === "emoji" ||
        pack.pack_type === "sticker" ||
        pack.pack_type === "sound" ? (
          <EmojiStickerPackEditModal
            pack={pack}
            userId={userId}
            token={token}
            onClose={() => setEditing(false)}
            onSaved={mutate}
          />
        ) : (
          <PackEditModal
            pack={pack}
            userId={userId}
            userBots={userBots}
            token={token}
            onClose={() => setEditing(false)}
            onSaved={mutate}
          />
        ))}

      {showCredits && (
        <Modal
          open
          onClose={() => setShowCredits(false)}
          title={`${pack.name} — Credits`}
        >
          <VoteCreditsPanel
            targetType="pack"
            targetId={pack.url}
            token={token}
            canRedeem
          />
        </Modal>
      )}
    </div>
  );
}

export function PacksTab({
  packs: packList,
  userId,
  userBots,
  token,
  mutate,
}: {
  packs: BotPack[];
  userId: string;
  userBots: IndexBot[];
  token: string;
  mutate: () => void;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {packList.length} {packList.length === 1 ? "pack" : "packs"}
        </p>
        <Link href="/packs/add">
          <Button variant="secondary" size="sm">
            Create Pack
          </Button>
        </Link>
      </div>

      {packList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Package
            size={32}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t created any packs yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packList.map((pack) => (
            <PackItem
              key={pack.url}
              pack={pack}
              userId={userId}
              userBots={userBots}
              token={token}
              mutate={mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
