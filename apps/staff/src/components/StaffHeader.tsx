"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import { ArrowLeft, Moon, Shield, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const ICON_BUTTON =
  "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

export function StaffHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dark = mounted && resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-40 h-14 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="flex h-full w-full items-center justify-between gap-4 px-4 lg:px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-zinc-950 dark:text-zinc-50"
        >
          <OmniplexLogo size={26} />
          <span className="text-base font-semibold tracking-tight">
            Omniplex
          </span>
          <span className="flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            <Shield size={11} />
            Staff
          </span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTheme(dark ? "light" : "dark")}
            className={ICON_BUTTON}
            aria-label={dark ? "Use the light theme" : "Use the dark theme"}
            title={dark ? "Use the light theme" : "Use the dark theme"}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a
            href={SITE_URL}
            className={ICON_BUTTON}
            aria-label="Back to Omniplex"
            title="Back to Omniplex"
          >
            <ArrowLeft size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}
