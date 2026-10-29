import { Award, MessageSquareText, PlusCircle, ThumbsUp } from "lucide-react";
import type { ReactNode } from "react";

const PERKS = [
  { icon: ThumbsUp, text: "Vote for the bots and servers you love" },
  { icon: MessageSquareText, text: "Leave reviews and follow updates" },
  { icon: PlusCircle, text: "List your own bot, server or pack" },
  { icon: Award, text: "Earn badges and Discord linked roles" },
];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-20">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-black/5 md:grid-cols-[1fr_1.1fr] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-black/40">
        <div className="relative overflow-hidden bg-linear-to-br from-indigo-500 via-indigo-700 to-[#1e1b4b] p-6 text-white sm:p-8">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-400/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-indigo-300/20 blur-3xl" />
          <div className="relative flex items-center gap-3 md:flex-col md:items-start md:gap-5">
            {/* biome-ignore lint/performance/noImgElement: static brand asset from /public */}
            <img
              src="/brand/logo/omniplex-app-icon-1024.png"
              alt=""
              className="h-12 w-12 rounded-xl shadow-lg md:h-16 md:w-16"
            />
            <div>
              <h2 className="text-xl font-semibold md:text-2xl">Omniplex</h2>
              <p className="text-sm text-indigo-100/80">
                The best place to find Discord bots and servers.
              </p>
            </div>
          </div>
          <ul className="relative mt-8 hidden space-y-3.5 md:block">
            {PERKS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-indigo-50/90"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <Icon size={14} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col justify-center p-6 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}
