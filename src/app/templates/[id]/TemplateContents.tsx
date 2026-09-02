import {
  Hash,
  Megaphone,
  MessagesSquare,
  Mic2,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import type { TemplateChannel, TemplateRole } from "@/lib/api/types";

const CHANNEL_ICONS: Record<number, typeof Hash> = {
  0: Hash, // text
  2: Volume2, // voice
  5: Megaphone, // announcement
  13: Mic2, // stage
  15: MessagesSquare, // forum
  16: MessagesSquare, // media
};

function channelColor(color: number): string {
  return color === 0 ? "#9ca3af" : `#${color.toString(16).padStart(6, "0")}`;
}

interface TemplateContentsProps {
  channels: TemplateChannel[];
  roles: TemplateRole[];
}

export function TemplateContents({ channels, roles }: TemplateContentsProps) {
  if (channels.length === 0 && roles.length === 0) return null;

  const categories = channels
    .filter((c) => c.type === 4)
    .sort((a, b) => a.position - b.position);
  const uncategorized = channels
    .filter((c) => c.type !== 4 && c.parent_id === null)
    .sort((a, b) => a.position - b.position);
  const childrenOf = (categoryId: number) =>
    channels
      .filter((c) => c.type !== 4 && c.parent_id === categoryId)
      .sort((a, b) => a.position - b.position);

  return (
    <section className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2">
      {channels.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Channels
            <span className="ml-1.5 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              ({channels.filter((c) => c.type !== 4).length})
            </span>
          </h2>
          <div className="space-y-4">
            {uncategorized.length > 0 && (
              <ChannelList channels={uncategorized} />
            )}
            {categories.map((category) => {
              const children = childrenOf(category.id);
              if (children.length === 0) return null;
              return (
                <div key={category.id}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
                    {category.name}
                  </p>
                  <ChannelList channels={children} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {roles.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Roles
            <span className="ml-1.5 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              ({roles.length})
            </span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {roles.map((role) => (
              <span
                key={role.id}
                className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pr-2.5 pl-2 text-xs font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
              >
                <ShieldCheck
                  size={12}
                  style={{ color: channelColor(role.color) }}
                />
                {role.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ChannelList({ channels }: { channels: TemplateChannel[] }) {
  return (
    <div className="space-y-1">
      {channels.map((channel) => {
        const Icon = CHANNEL_ICONS[channel.type] ?? Hash;
        return (
          <div
            key={channel.id}
            className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400"
          >
            <Icon
              size={14}
              className="shrink-0 text-zinc-400 dark:text-zinc-600"
            />
            <span className="truncate">{channel.name}</span>
          </div>
        );
      })}
    </div>
  );
}
