"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import {
  Activity,
  ArrowLeft,
  Check,
  ClipboardList,
  ListChecks,
  Lock,
  type LucideIcon,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { BotConstellation } from "@/app/(auth)/BotConstellation";
import { ThemeToggle } from "@/components/ThemeToggle";

const STEPS = ["Discord", "Two-factor", "Done"];

const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ListChecks,
    title: "Review the queue",
    body: "Test, approve and certify bots and servers.",
  },
  {
    icon: ClipboardList,
    title: "Handle reports and tickets",
    body: "Work through reports, support tickets and applications.",
  },
  {
    icon: Activity,
    title: "See what changed",
    body: "Every change across the site, in one activity log.",
  },
  {
    icon: Users,
    title: "Run the team",
    body: "Manage staff, content, partners and the shop.",
  },
];

interface AuthShellProps {
  step: 1 | 2 | 3;
  children: ReactNode;
}

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
                  ? "bg-teal-600 text-white"
                  : current
                    ? "bg-teal-600/15 text-teal-700 ring-1 ring-teal-600 dark:text-teal-300"
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
              <span className="mx-1 h-px w-4 bg-zinc-200 sm:w-6 dark:bg-zinc-700" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function AuthShell({ step, children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen flex-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-white lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgb(20_184_166/0.45),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgb(13_148_136/0.3),transparent_55%)]" />
        <BotConstellation />

        <div className="relative flex flex-1 flex-col justify-between p-10 xl:p-14">
          <div className="flex items-center gap-2.5">
            <OmniplexLogo size={28} />
            <span className="text-base font-semibold tracking-tight">
              Omniplex
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-teal-100 ring-1 ring-white/15">
              Staff
            </span>
          </div>

          <div className="max-w-md">
            {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
            <img
              src="/brand/bots/arcadia/app-icon-1024.png"
              alt=""
              className="h-14 w-14 rounded-2xl shadow-lg shadow-teal-950/50 ring-1 ring-white/15"
            />
            <h1 className="mt-6 text-3xl font-semibold tracking-tight xl:text-4xl">
              Everything staff need to keep Omniplex running.
            </h1>
            <ul className="mt-10 space-y-5">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-teal-200 ring-1 ring-white/10">
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
            <Lock size={12} />
            Staff only. Sign-ins and changes are logged.
          </p>
        </div>
      </aside>

      <section className="flex min-h-screen flex-col px-6 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 lg:invisible">
            <OmniplexLogo size={26} />
            <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Omniplex
            </span>
            <span className="rounded-full bg-teal-600/10 px-2 py-0.5 text-xs font-medium text-teal-700 dark:text-teal-300">
              Staff
            </span>
          </div>
          <ThemeToggle className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50" />
        </div>

        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-sm">
            <Steps step={step} />
            <div className="mt-10">{children}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
          <a
            href={SITE_URL}
            className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
          >
            <ArrowLeft size={12} />
            Back to Omniplex
          </a>
          <span className="flex items-center gap-1.5 lg:hidden">
            <Lock size={12} />
            Staff only. Sign-ins and changes are logged.
          </span>
        </div>
      </section>
    </div>
  );
}
