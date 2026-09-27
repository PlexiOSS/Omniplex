import type { ReactNode } from "react";

export interface MentionLookup {
  users: Map<string, string>;
  roles: Record<string, { name: string; color: number }>;
  channels: Record<string, string>;
}

interface DiscordContentProps {
  content: string;
  lookup?: MentionLookup;
}

// biome-ignore lint/complexity/useRegexLiterals: named groups in a literal need an ES2018 target, tsconfig targets ES2017
const TOKEN = new RegExp(
  String.raw`<(?<animated>a?):(?<emoji>\w{2,32}):(?<emojiId>\d{15,21})>|<@!?(?<user>\d{15,21})>|<@&(?<role>\d{15,21})>|<#(?<channel>\d{15,21})>|<\/(?<command>[\w -]{1,64}):\d{15,21}>|<t:(?<time>-?\d{1,13})(?::(?<style>[tTdDfFR]))?>|(?<mass>@everyone|@here)|\x60(?<code>[^\x60\n]+)\x60|(?<url>https?:\/\/[^\s<>]*[^\s<>.,:;"')\]!?])`,
  "g",
);

const TIME_FORMAT: Record<string, Intl.DateTimeFormatOptions> = {
  t: { hour: "2-digit", minute: "2-digit" },
  T: { hour: "2-digit", minute: "2-digit", second: "2-digit" },
  d: { day: "2-digit", month: "2-digit", year: "numeric" },
  D: { day: "numeric", month: "long", year: "numeric" },
  f: {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
  F: {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  },
};

function relative(date: Date): string {
  const diff = (date.getTime() - Date.now()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["year", 31_536_000],
    ["month", 2_592_000],
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ];
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  for (const [unit, seconds] of units) {
    if (Math.abs(diff) >= seconds)
      return rtf.format(Math.round(diff / seconds), unit);
  }
  return rtf.format(Math.round(diff), "second");
}

const chip =
  "mx-px inline-flex max-w-full items-baseline rounded bg-accent/15 px-1 font-medium text-accent wrap-anywhere";

export function DiscordContent({ content, lookup }: DiscordContentProps) {
  const nodes: ReactNode[] = [];
  let last = 0;

  for (const match of content.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) nodes.push(content.slice(last, index));
    last = index + match[0].length;
    const g = match.groups ?? {};
    const key = `${index}-${match[0]}`;

    if (g.emojiId) {
      nodes.push(
        // biome-ignore lint/performance/noImgElement: inline Discord custom emoji
        <img
          key={key}
          src={`https://cdn.discordapp.com/emojis/${g.emojiId}.${g.animated ? "gif" : "webp"}?size=48`}
          alt={`:${g.emoji}:`}
          title={`:${g.emoji}:`}
          loading="lazy"
          className="mx-px inline-block h-[1.375em] w-auto align-[-0.3em]"
        />,
      );
    } else if (g.user) {
      const name = lookup?.users.get(g.user);
      nodes.push(
        <span key={key} className={chip} title={g.user}>
          @{name ?? "unknown-user"}
        </span>,
      );
    } else if (g.role) {
      const role = lookup?.roles[g.role];
      const hex = role?.color
        ? `#${role.color.toString(16).padStart(6, "0")}`
        : undefined;
      nodes.push(
        <span
          key={key}
          className={chip}
          title={`Role ${g.role}`}
          style={hex ? { color: hex, backgroundColor: `${hex}26` } : undefined}
        >
          @{role?.name ?? "role"}
        </span>,
      );
    } else if (g.channel) {
      nodes.push(
        <span key={key} className={chip} title={`Channel ${g.channel}`}>
          #{lookup?.channels[g.channel] ?? "channel"}
        </span>,
      );
    } else if (g.command) {
      nodes.push(
        <span key={key} className={chip}>
          /{g.command}
        </span>,
      );
    } else if (g.time) {
      const date = new Date(Number(g.time) * 1000);
      const style = g.style ?? "f";
      const text = Number.isNaN(date.getTime())
        ? match[0]
        : style === "R"
          ? relative(date)
          : date.toLocaleString(undefined, TIME_FORMAT[style]);
      nodes.push(
        <time
          key={key}
          dateTime={
            Number.isNaN(date.getTime()) ? undefined : date.toISOString()
          }
          title={
            Number.isNaN(date.getTime()) ? undefined : date.toLocaleString()
          }
          className="rounded bg-zinc-100 px-1 dark:bg-zinc-800"
        >
          {text}
        </time>,
      );
    } else if (g.mass) {
      nodes.push(
        <span key={key} className={chip}>
          {g.mass}
        </span>,
      );
    } else if (g.code) {
      nodes.push(
        <code
          key={key}
          className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[0.85em] dark:bg-zinc-800"
        >
          {g.code}
        </code>,
      );
    } else if (g.url) {
      nodes.push(
        <a
          key={key}
          href={g.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-accent underline-offset-2 hover:underline"
        >
          {g.url}
        </a>,
      );
    }
  }
  if (last < content.length) nodes.push(content.slice(last));

  return (
    <div className="whitespace-pre-wrap text-sm text-zinc-700 wrap-anywhere dark:text-zinc-300">
      {nodes}
    </div>
  );
}
