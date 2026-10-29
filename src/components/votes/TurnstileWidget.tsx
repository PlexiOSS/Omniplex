"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY } from "@/lib/api/config";

interface TurnstileWidgetProps {
  action: string;
  onToken: (token: string | null) => void;
}

interface TurnstileRenderOptions {
  sitekey: string;
  action: string;
  theme: "light" | "dark";
  size: "flexible";
  "refresh-expired": "auto";
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

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let widgetId: string | undefined;
    let cancelled = false;
    setFailed(false);

    loadTurnstile()
      .then(() => {
        if (cancelled || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          theme: resolvedTheme === "dark" ? "dark" : "light",
          size: "flexible",
          "refresh-expired": "auto",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
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

  return <div ref={ref} className="min-h-[65px] w-full" />;
}
