import { AlertTriangle, Paperclip } from "lucide-react";
import type {
  DiscordEmbed,
  TicketAttachment,
  TicketMessage,
} from "@/lib/api/types";
import { DiscordContent, type MentionLookup } from "./DiscordContent";

interface TicketMessageBodyProps {
  message: TicketMessage;
  lookup: MentionLookup;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

function colorOf(embed: DiscordEmbed): string | undefined {
  if (embed.color === undefined || embed.color === 0) return undefined;
  return `#${embed.color.toString(16).padStart(6, "0")}`;
}

function isHttpUrl(url: string | undefined): url is string {
  return !!url && /^https?:\/\//.test(url);
}

function Embed({
  embed,
  lookup,
}: {
  embed: DiscordEmbed;
  lookup: MentionLookup;
}) {
  const color = colorOf(embed);
  const fields = embed.fields ?? [];
  const thumbnail = isHttpUrl(embed.thumbnail?.url)
    ? embed.thumbnail?.url
    : undefined;
  const image = isHttpUrl(embed.image?.url) ? embed.image?.url : undefined;
  const timestamp = embed.timestamp ? new Date(embed.timestamp) : null;
  const hasFooter =
    embed.footer?.text || (timestamp && !Number.isNaN(timestamp.getTime()));

  return (
    <div
      className="mt-2 flex min-w-0 max-w-full gap-3 overflow-hidden rounded-lg border border-zinc-200 border-l-4 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
      style={color ? { borderLeftColor: color } : undefined}
    >
      <div className="min-w-0 flex-1">
        {embed.author?.name && (
          <div className="mb-1 flex min-w-0 items-center gap-1.5">
            {isHttpUrl(embed.author.icon_url) && (
              // biome-ignore lint/performance/noImgElement: tiny embed author icon from Discord
              <img
                src={embed.author.icon_url}
                alt=""
                loading="lazy"
                className="h-5 w-5 shrink-0 rounded-full"
              />
            )}
            <span className="truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {embed.author.name}
            </span>
          </div>
        )}
        {embed.title &&
          (isHttpUrl(embed.url) ? (
            <a
              href={embed.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="block text-sm font-semibold text-accent wrap-anywhere hover:underline"
            >
              {embed.title}
            </a>
          ) : (
            <p className="text-sm font-semibold text-zinc-950 wrap-anywhere dark:text-zinc-50">
              {embed.title}
            </p>
          ))}
        {embed.description && (
          <div className="mt-1">
            <DiscordContent content={embed.description} lookup={lookup} />
          </div>
        )}
        {fields.length > 0 && (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {fields.map((field, i) => (
              <div
                key={`${field.name}-${i}`}
                className={`min-w-0 ${field.inline ? "" : "sm:col-span-3"}`}
              >
                <p className="text-xs font-semibold text-zinc-950 wrap-anywhere dark:text-zinc-50">
                  {field.name}
                </p>
                <DiscordContent content={field.value} lookup={lookup} />
              </div>
            ))}
          </div>
        )}
        {image && (
          // biome-ignore lint/performance/noImgElement: remote embed image from Discord
          <img
            src={image}
            alt=""
            loading="lazy"
            className="mt-2 max-h-80 max-w-full rounded-md"
          />
        )}
        {hasFooter && (
          <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            {isHttpUrl(embed.footer?.icon_url) && (
              // biome-ignore lint/performance/noImgElement: tiny embed footer icon from Discord
              <img
                src={embed.footer?.icon_url}
                alt=""
                loading="lazy"
                className="h-4 w-4 shrink-0 rounded-full"
              />
            )}
            <span className="min-w-0 wrap-anywhere">
              {embed.footer?.text}
              {embed.footer?.text &&
                timestamp &&
                !Number.isNaN(timestamp.getTime()) &&
                " · "}
              {timestamp &&
                !Number.isNaN(timestamp.getTime()) &&
                timestamp.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      {thumbnail && (
        // biome-ignore lint/performance/noImgElement: remote embed thumbnail from Discord
        <img
          src={thumbnail}
          alt=""
          loading="lazy"
          className="h-16 w-16 shrink-0 rounded-md object-cover"
        />
      )}
    </div>
  );
}

function Attachment({ attachment }: { attachment: TicketAttachment }) {
  const errors = attachment.errors ?? [];
  return (
    <div
      className="mt-2 flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800"
      title="This file was attached through the old Discord ticket system and isn't stored on Omniplex, so it can't be opened here."
    >
      <Paperclip size={13} className="shrink-0 text-zinc-400" />
      <span className="min-w-0 flex-1 truncate font-medium text-zinc-600 dark:text-zinc-400">
        {attachment.name}
      </span>
      <span className="shrink-0 text-zinc-400 dark:text-zinc-500">
        {formatBytes(attachment.size)} · Archived
      </span>
      {errors.length > 0 && (
        <span
          className="flex shrink-0 items-center gap-1 text-amber-600 dark:text-amber-400"
          title={errors.join("\n")}
        >
          <AlertTriangle size={12} />
          Upload issue
        </span>
      )}
    </div>
  );
}

export function TicketMessageBody({ message, lookup }: TicketMessageBodyProps) {
  const embeds = message.embeds ?? [];
  const attachments = message.attachments ?? [];
  const text = message.content.trim();

  if (!text && embeds.length === 0 && attachments.length === 0) {
    return (
      <p className="mt-1 text-sm italic text-zinc-400 dark:text-zinc-500">
        No text content
      </p>
    );
  }

  return (
    <div className="mt-1 min-w-0">
      {text && <DiscordContent content={message.content} lookup={lookup} />}
      {embeds.map((embed, i) => (
        <Embed key={`${message.id}-embed-${i}`} embed={embed} lookup={lookup} />
      ))}
      {attachments.map((attachment) => (
        <Attachment key={attachment.id} attachment={attachment} />
      ))}
    </div>
  );
}
