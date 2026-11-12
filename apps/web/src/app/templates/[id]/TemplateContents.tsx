import type { TemplateChannel, TemplateRole } from "@omniplex/core/api/types";
import {
  ChevronDown,
  Hash,
  Megaphone,
  MessagesSquare,
  Mic2,
  ShieldCheck,
  Volume2,
} from "lucide-react";

const CHANNEL_ICONS: Record<number, typeof Hash> = {
  0: Hash,
  2: Volume2,
  5: Megaphone,
  13: Mic2,
  15: MessagesSquare,
  16: MessagesSquare,
};

function roleColor(color: number): string {
  return color === 0 ? "#9ca3af" : `#${color.toString(16).padStart(6, "0")}`;
}

const card =
  "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";

function CardTitle({ title, count }: { title: string; count: number }) {
  return (
    <h2 className="mb-4 flex items-baseline gap-1.5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
      {title}
      <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
        {count}
      </span>
    </h2>
  );
}

export function TemplateChannels({
  channels,
}: {
  channels: TemplateChannel[];
}) {
  const byPosition = (a: TemplateChannel, b: TemplateChannel) =>
    a.position - b.position;
  const categories = channels.filter((c) => c.type === 4).sort(byPosition);
  const uncategorized = channels
    .filter((c) => c.type !== 4 && c.parent_id === null)
    .sort(byPosition);
  const childrenOf = (categoryId: number) =>
    channels
      .filter((c) => c.type !== 4 && c.parent_id === categoryId)
      .sort(byPosition);
  const total = channels.filter((c) => c.type !== 4).length;

  if (total === 0) return null;

  return (
    <section className={card}>
      <CardTitle title="Channels" count={total} />
      <div className="space-y-4 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-950/50">
        {uncategorized.length > 0 && <ChannelList channels={uncategorized} />}
        {categories.map((category) => {
          const children = childrenOf(category.id);
          if (children.length === 0) return null;
          return (
            <div key={category.id}>
              <p className="mb-1 flex items-center gap-1 px-1 text-[11px] font-semibold tracking-wide text-zinc-500 uppercase dark:text-zinc-400">
                <ChevronDown size={12} />
                {category.name}
              </p>
              <ChannelList channels={children} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ChannelList({ channels }: { channels: TemplateChannel[] }) {
  return (
    <ul className="space-y-0.5">
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel.type] ?? Hash;
        return (
          <li
            key={channel.id}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm text-zinc-600 dark:text-zinc-400"
          >
            <Icon
              size={15}
              className="shrink-0 text-zinc-400 dark:text-zinc-500"
            />
            <span className="truncate">{channel.name}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function TemplateRoles({ roles }: { roles: TemplateRole[] }) {
  if (roles.length === 0) return null;

  return (
    <section className={card}>
      <CardTitle title="Roles" count={roles.length} />
      <div className="flex flex-wrap gap-1.5">
        {roles.map((role) => (
          <span
            key={role.id}
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pr-2.5 pl-2 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
          >
            <ShieldCheck size={12} style={{ color: roleColor(role.color) }} />
            {role.name}
          </span>
        ))}
      </div>
    </section>
  );
}
