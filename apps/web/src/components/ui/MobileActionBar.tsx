"use client";

import { ExternalLink, ThumbsUp } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";

interface MobileActionBarProps {
  targetId: string;
  name: string;
  avatar: string;
  primaryHref?: string;
  primaryLabel: string;
}

export function MobileActionBar({
  targetId,
  name,
  avatar,
  primaryHref,
  primaryLabel,
}: MobileActionBarProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetId]);

  return (
    <div
      aria-hidden={!show}
      className={[
        "fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/90 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-200 lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90",
        show ? "translate-y-0" : "pointer-events-none translate-y-full",
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-xl items-center gap-2">
        <Avatar src={avatar} alt={name} size={32} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {name}
        </span>
        <button
          type="button"
          tabIndex={show ? 0 : -1}
          onClick={() =>
            document
              .getElementById(targetId)
              ?.scrollIntoView({ behavior: "smooth", block: "center" })
          }
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <ThumbsUp size={14} />
          Vote
        </button>
        {primaryHref && (
          <a
            href={primaryHref}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={show ? 0 : -1}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3 text-sm font-medium text-accent-fg"
          >
            <ExternalLink size={14} />
            {primaryLabel}
          </a>
        )}
      </div>
    </div>
  );
}
