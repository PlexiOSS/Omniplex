"use client";

import { TURNSTILE_SITE_KEY } from "@omniplex/core/api/config";
import { Loader2, ShieldCheck } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";

interface TurnstileWidgetProps {
  action: string;
  onToken: (token: string | null) => void;
}

interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  theme: "light" | "dark";
  size: "flexible";
  appearance: "interaction-only";
  "refresh-expired": "auto";
  "before-interactive-callback": () => void;
  "after-interactive-callback": () => void;
  callback: (token: string) => void;
  "expired-callback": () => void;
  "error-callback": () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, options: TurnstileRenderOptions) => string;
  remove: (widgetId: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let loader: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      script.remove();
      reject(new Error("Turnstile failed to load"));
    };
    document.head.appendChild(script);
  });
  return loader;
}

export function TurnstileWidget({ action, onToken }: TurnstileWidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);
  const { resolvedTheme } = useTheme();
  const [failed, setFailed] = useState(!TURNSTILE_SITE_KEY);
  const [status, setStatus] = useState<"checking" | "interactive" | "verified">(
    "checking",
  );

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let widgetId: string | undefined;
    let cancelled = false;
    setFailed(false);
    setStatus("checking");

    loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: resolvedTheme === "dark" ? "dark" : "light",
          size: "flexible",
          appearance: "interaction-only",
          "refresh-expired": "auto",
          "before-interactive-callback": () => setStatus("interactive"),
          "after-interactive-callback": () => setStatus("checking"),
          callback: (token) => {
            setStatus("verified");
            onTokenRef.current(token);
          },
          "expired-callback": () => {
            setStatus("checking");
            onTokenRef.current(null);
          },
          "error-callback": () => {
            setStatus("checking");
            onTokenRef.current(null);
          },
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      onTokenRef.current(null);
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [action, resolvedTheme]);

  if (failed) {
    return (
      <p className="text-center text-xs text-red-600 dark:text-red-400">
        The captcha couldn&apos;t load. If you use a content blocker, allow
        challenges.cloudflare.com and reload the page.
      </p>
    );
  }

  return (
    <div className="w-full">
      <div
        ref={ref}
        className={status === "interactive" ? "min-h-[65px] w-full" : "w-full"}
      />
      {status !== "interactive" && (
        <p
          aria-live="polite"
          className="flex items-center justify-center gap-1.5 py-1 text-xs text-zinc-500 dark:text-zinc-400"
        >
          {status === "verified" ? (
            <>
              <ShieldCheck size={13} className="text-emerald-500" />
              Verified, you can vote
            </>
          ) : (
            <>
              <Loader2 size={13} className="animate-spin" />
              Checking you&apos;re human…
            </>
          )}
        </p>
      )}
    </div>
  );
}
