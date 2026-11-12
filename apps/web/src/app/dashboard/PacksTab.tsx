"use client";

import { packs } from "@omniplex/core/api";
import type { BotPack, IndexBot } from "@omniplex/core/api/types";
import {
  mirroredAvatarUrl,
  packEmojiUrl,
  packStickerUrl,
} from "@omniplex/core/utils/assets";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { Dropdown, DropdownItem } from "@omniplex/ui/Dropdown";
import { Modal } from "@omniplex/ui/Modal";
import {
  ArrowUpRight,
  Coins,
  MoreHorizontal,
  Music,
  Package,
  Pencil,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { PackTypeBadge } from "@/components/packs/PackTypeBadge";
import { VoteCreditsPanel } from "@/components/votes/VoteCreditsPanel";
import { EmojiStickerPackEditModal } from "./EmojiStickerPackEditModal";
import { PackEditModal } from "./PackEditModal";

function PackPreview({ pack }: { pack: BotPack }) {
  const ring = "ring-2 ring-white dark:ring-zinc-900";
  const tile = `flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 ${ring}`;

  if (pack.pack_type === "bot") {
    return (
      <div className="flex -space-x-2">
        {(pack.bots ?? []).slice(0, 4).map((bot) => (
          <Avatar
            key={bot.bot_id}
            src={mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar)}
            alt={bot.user.username}
            size={32}
            className={ring}
          />
        ))}
      </div>
    );
  }

  if (pack.pack_type === "server") {
    return (
      <div className="flex -space-x-2">
        {(pack.servers ?? []).slice(0, 4).map((server) => (
          <Avatar
            key={server.server_id}
            src={mirroredAvatarUrl("servers", server.server_id, server.avatar)}
            alt={server.name}
            size={32}
            className={ring}
          />
        ))}
      </div>
    );
  }

  const items =
    pack.pack_type === "emoji"
      ? (pack.emojis ?? []).map((e) => ({
          id: e.id,
          name: e.name,
          src: packEmojiUrl(pack.url, e.id, e.animated) as string | null,
        }))
      : pack.pack_type === "sticker"
        ? (pack.stickers ?? []).map((st) => ({
            id: st.id,
            name: st.name,
            src: packStickerUrl(pack.url, st.id, st.animated) as string | null,
          }))
        : (pack.sounds ?? []).map((so) => ({
            id: so.id,
            name: so.name,
            src: null as string | null,
          }));

  return (
    <div className="flex -space-x-2">
      {items.slice(0, 4).map((item) => (
        <span key={item.id} className={tile}>
          {item.src ? (
            // biome-ignore lint/performance/noImgElement: small pack preview from our CDN
            <img src={item.src} alt={item.name} width={20} height={20} />
          ) : (
            <Music size={14} className="text-zinc-400 dark:text-zinc-500" />
          )}
        </span>
      ))}
    </div>
  );
}

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function remove() {
    setDeleting(true);
    setDeleteError(null);
    packs
      .deletePack(userId, pack.url, token)
      .then(() => {
        setConfirmingDelete(false);
        mutate();
      })
      .catch(() => {
        setDeleting(false);
        setDeleteError("Couldn't delete the pack. Try again.");
      });
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <PackPreview pack={pack} />

      <div className="mt-3 flex min-w-0 items-center gap-2">
        <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
          {pack.name}
        </p>
        <PackTypeBadge type={pack.pack_type} />
      </div>
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

      <div className="min-h-4 flex-1" />
      <div className="-mx-4 -mb-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-b-[calc(var(--radius-2xl)-1px)] border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
        <span className="whitespace-nowrap">
          {formatCountLabel(pack.votes, "vote")}
        </span>
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
          <Dropdown
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMenuOpen((o) => !o)}
                className="h-7 px-1.5 text-xs"
                aria-label="More actions"
              >
                <MoreHorizontal size={14} />
              </Button>
            }
          >
            <DropdownItem
              icon={<Coins size={14} />}
              onClick={() => {
                setMenuOpen(false);
                setShowCredits(true);
              }}
            >
              Vote credits
            </DropdownItem>
            <DropdownItem
              icon={<Trash2 size={14} />}
              danger
              onClick={() => {
                setMenuOpen(false);
                setConfirmingDelete(true);
              }}
            >
              Delete pack
            </DropdownItem>
          </Dropdown>
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

      {confirmingDelete && (
        <Modal
          open
          onClose={() => !deleting && setConfirmingDelete(false)}
          title={`Delete ${pack.name}?`}
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This removes the pack, its votes and its page. It can&apos;t be
            undone.
          </p>
          {deleteError && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">
              {deleteError}
            </p>
          )}
          <div className="mt-5 flex justify-end gap-2">
            <Button
              variant="secondary"
              disabled={deleting}
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={remove}>
              Delete pack
            </Button>
          </div>
        </Modal>
      )}

      {showCredits && (
        <Modal
          open
          onClose={() => setShowCredits(false)}
          title={`Vote credits for ${pack.name}`}
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
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
