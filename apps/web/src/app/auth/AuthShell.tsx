import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import {
  ArrowLeft,
  Award,
  Check,
  MessageSquareText,
  PlusCircle,
  ShieldCheck,
  ThumbsUp,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { BotConstellation } from "@/components/auth/BotConstellation";

const STEPS = ["Discord", "Finishing up"];

const PERKS = [
  {
    icon: ThumbsUp,
    title: "Vote for what you love",
    body: "Help the best bots and servers rise to the top.",
  },
  {
    icon: MessageSquareText,
    title: "Review and follow",
    body: "Leave reviews and get updates from listings you like.",
  },
  {
    icon: PlusCircle,
    title: "List your own",
    body: "Add a bot, server or pack and manage it with your team.",
  },
  {
    icon: Award,
    title: "Earn badges",
    body: "Collect badges and turn them into Discord linked roles.",
  },
];

function Steps({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-xs">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-semibold",
                done
                  ? "bg-accent text-accent-fg"
                  : current
                    ? "bg-accent/15 text-accent ring-1 ring-accent"
                    : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500",
              ].join(" ")}
            >
              {done ? <Check size={11} /> : n}
            </span>
            <span
              className={
                current
                  ? "font-medium text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-400 dark:text-zinc-500"
              }
            >
              {label}
            </span>
            {n < STEPS.length && (
              <span className="mx-1 h-px w-6 bg-zinc-200 dark:bg-zinc-700" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function AuthShell({
  children,
  step = 1,
}: {
  children: ReactNode;
  step?: 1 | 2;
}) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(99_102_241/0.5),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgb(139_92_246/0.32),transparent_55%)]" />
        <BotConstellation />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <Link href="/" className="flex w-fit items-center gap-2.5">
            <OmniplexLogo size={28} />
            <span className="text-base font-semibold tracking-tight">
              Omniplex
            </span>
          </Link>

          <div className="max-w-md">
            {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
            <img
              src="/brand/logo/omniplex-app-icon-1024.png"
              alt=""
              className="h-14 w-14 rounded-2xl shadow-lg shadow-indigo-950/50 ring-1 ring-white/15"
            />
            <h1 className="mt-6 text-3xl font-semibold tracking-tight xl:text-4xl">
              The best place to find Discord bots and servers.
            </h1>
            <ul className="mt-10 space-y-5">
              {PERKS.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-indigo-200 ring-1 ring-white/10">
                    <Icon size={17} />
                  </span>
                  <span>
                    <span className="block text-sm font-medium">{title}</span>
                    <span className="block text-sm text-zinc-400">{body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-zinc-400">
            <ShieldCheck size={12} />
            Free, and you sign in with Discord. No new password.
          </p>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <Link
          href="/"
          className="flex w-fit items-center gap-2 text-zinc-950 lg:invisible dark:text-zinc-50"
        >
          <OmniplexLogo size={26} />
          <span className="text-base font-semibold tracking-tight">
            Omniplex
          </span>
        </Link>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <Steps step={step} />
            <div className="mt-10">{children}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeft size={12} />
            Back to Omniplex
          </Link>
          <span>
            <Link href="/legal/terms" className="hover:text-accent">
              Terms
            </Link>
            {" · "}
            <Link href="/legal/privacy" className="hover:text-accent">
              Privacy
            </Link>
          </span>
        </div>
      </section>
    </div>
  );
}
