"use client";

import { Check, Lock } from "lucide-react";
import type { ReactNode } from "react";

const STEPS = ["Discord", "Two-factor", "Done"];

interface AuthShellProps {
  step: 1 | 2 | 3;
  children: ReactNode;
}

export function AuthShell({ step, children }: AuthShellProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-20">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-black/5 md:grid-cols-[1fr_1.1fr] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40">
        <div className="relative overflow-hidden bg-linear-to-br from-teal-500 via-teal-700 to-[#042f2e] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -right-16 -bottom-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex items-center gap-3 md:flex-col md:items-start md:gap-5">
            {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
            <img
              src="/brand/bots/arcadia/app-icon-1024.png"
              alt=""
              className="h-12 w-12 rounded-xl shadow-lg md:h-16 md:w-16"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-teal-100/80">
                Omniplex
              </p>
              <h1 className="text-xl font-semibold md:text-2xl">Staff Panel</h1>
            </div>
          </div>
          <ul className="relative mt-8 hidden space-y-3 text-sm text-teal-50/90 md:block">
            <li>Review bots and servers in the queue</li>
            <li>Handle reports, tickets and applications</li>
            <li>Manage staff, content and the shop</li>
          </ul>
          <p className="relative mt-6 flex items-center gap-1.5 text-xs text-teal-100/80 md:mt-12">
            <Lock size={12} />
            Discord sign-in and two-factor authentication required
          </p>
        </div>

        <div className="flex flex-col p-6 sm:p-10">
          <ol className="mb-8 flex items-center gap-2 text-xs">
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
          <div className="flex flex-1 flex-col justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}
