"use client";

import { users } from "@omniplex/core/api";
import { getSession } from "@omniplex/core/utils/auth";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AccentColor,
  type CardStat,
  CUSTOMIZATION_DEFAULTS,
  CustomizationContext,
  type CustomizationPrefs,
  type FontOption,
  type LayoutOption,
  MAX_HIDDEN_TAGS,
  presetFields,
  type RadiusOption,
  STORAGE_KEY,
  type SyncState,
  type ThemePreset,
  tagSlug,
} from "@/hooks/useCustomization";

const SAVED_AT_KEY = "omniplex-prefs-saved-at";
const OWNER_KEY = "omniplex-prefs-owner";
const HIDDEN_TAGS_STYLE_ID = "omniplex-hidden-tags";
const SYNC_DELAY = 1200;

function clean(raw: unknown): CustomizationPrefs {
  const value =
    raw && typeof raw === "object" ? (raw as Partial<CustomizationPrefs>) : {};
  const prefs = { ...CUSTOMIZATION_DEFAULTS, ...value };
  prefs.hiddenTags = Array.isArray(prefs.hiddenTags)
    ? prefs.hiddenTags.map(tagSlug).filter(Boolean).slice(0, MAX_HIDDEN_TAGS)
    : [];
  if (!Array.isArray(prefs.hiddenStats)) {
    prefs.hiddenStats = CUSTOMIZATION_DEFAULTS.hiddenStats;
  }
  return prefs;
}

function readPrefs(): CustomizationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? clean(JSON.parse(raw)) : CUSTOMIZATION_DEFAULTS;
  } catch {
    return CUSTOMIZATION_DEFAULTS;
  }
}

function readSavedAt(): number {
  try {
    return Number(localStorage.getItem(SAVED_AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function savePrefs(prefs: CustomizationPrefs, savedAt = Date.now()) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    localStorage.setItem(SAVED_AT_KEY, String(savedAt));
  } catch {}
}

function hiddenTagsCss(tags: string[]): string {
  if (tags.length === 0) return "";
  return `${tags.map((t) => `[data-tags~="${t}"]`).join(",")}{display:none!important}`;
}

function applyPrefs(prefs: CustomizationPrefs) {
  const el = document.documentElement;
  el.dataset.accent = prefs.accent;
  el.dataset.font = prefs.font;
  el.dataset.layout = prefs.layout;
  el.dataset.radius = prefs.radius;
  el.dataset.surface = prefs.surface;
  el.dataset.density = prefs.density;
  el.dataset.textSize = prefs.textSize;
  el.dataset.motion = prefs.motion;
  el.dataset.hiddenStats = prefs.hiddenStats.join(" ");
  el.dataset.hideNsfw = String(prefs.hideNsfw);
  el.dataset.blurNsfw = String(prefs.blurNsfw && !prefs.hideNsfw);
  el.dataset.hideOffline = String(prefs.hideOffline);

  let style = document.getElementById(HIDDEN_TAGS_STYLE_ID);
  if (!style) {
    style = document.createElement("style");
    style.id = HIDDEN_TAGS_STYLE_ID;
    document.head.appendChild(style);
  }
  style.textContent = hiddenTagsCss(prefs.hiddenTags);
}

function readOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function saveOwner(userId: string) {
  try {
    localStorage.setItem(OWNER_KEY, userId);
  } catch {}
}

function hasLocalPrefs(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch {
    return false;
  }
}

export function CustomizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<CustomizationPrefs>(
    CUSTOMIZATION_DEFAULTS,
  );
  const [sync, setSync] = useState<SyncState>("device");
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef(prefs);
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const adopting = useRef(false);

  useEffect(() => {
    const stored = readPrefs();
    latest.current = stored;
    setPrefs(stored);
    applyPrefs(stored);
  }, []);

  useEffect(() => {
    if (!pathname) return;
    setUserId(getSession()?.user_id ?? null);
  }, [pathname]);

  const push = useCallback((next: CustomizationPrefs) => {
    const session = getSession();
    if (!session) return;
    if (timer.current) clearTimeout(timer.current);
    setSync("saving");
    timer.current = setTimeout(() => {
      users
        .setSitePrefs(
          session.user_id,
          { ...next, mode: themeRef.current ?? "system" },
          session.token,
        )
        .then((res) => {
          if (res.updated_at) {
            savePrefs(latest.current, Date.parse(res.updated_at));
          }
          saveOwner(session.user_id);
          setSync("account");
        })
        .catch(() => setSync("error"));
    }, SYNC_DELAY);
  }, []);

  useEffect(() => {
    if (!userId) {
      setSync("device");
      return;
    }
    const session = getSession();
    if (!session) return;
    let cancelled = false;
    users
      .getSitePrefs(session.user_id, session.token)
      .then((res) => {
        if (cancelled) return;
        const remoteAt = res.updated_at ? Date.parse(res.updated_at) : 0;
        const localAt = readSavedAt();
        const owner = readOwner();
        const otherAccount = owner !== null && owner !== session.user_id;
        if (remoteAt > 0 && (otherAccount || remoteAt >= localAt)) {
          const next = clean(res.prefs);
          saveOwner(session.user_id);
          latest.current = next;
          setPrefs(next);
          applyPrefs(next);
          savePrefs(next, remoteAt);
          const mode = res.prefs.mode;
          if (
            (mode === "light" || mode === "dark" || mode === "system") &&
            mode !== themeRef.current
          ) {
            adopting.current = true;
            setTheme(mode);
          }
          setSync("account");
        } else if (otherAccount) {
          saveOwner(session.user_id);
          setSync("account");
        } else if (localAt > 0 || hasLocalPrefs()) {
          push(latest.current);
        } else {
          setSync("account");
        }
      })
      .catch(() => {
        if (!cancelled) setSync("error");
      });
    return () => {
      cancelled = true;
    };
  }, [userId, push, setTheme]);

  const update = useCallback(
    (patch: Partial<CustomizationPrefs>) => {
      const next = { ...latest.current, ...patch };
      latest.current = next;
      setPrefs(next);
      applyPrefs(next);
      savePrefs(next);
      push(next);
    },
    [push],
  );

  const prevTheme = useRef(theme);
  useEffect(() => {
    if (adopting.current) {
      adopting.current = false;
    } else if (prevTheme.current !== undefined && prevTheme.current !== theme) {
      savePrefs(latest.current);
      push(latest.current);
    }
    prevTheme.current = theme;
  }, [theme, push]);

  function applyPreset(preset: ThemePreset) {
    update(presetFields(preset));
    if (preset.mode) setTheme(preset.mode);
  }

  function toggleStat(stat: CardStat) {
    const hidden = latest.current.hiddenStats;
    update({
      hiddenStats: hidden.includes(stat)
        ? hidden.filter((s) => s !== stat)
        : [...hidden, stat],
    });
  }

  function toggleTag(tag: string) {
    const slug = tagSlug(tag);
    if (!slug) return;
    const hidden = latest.current.hiddenTags;
    update({
      hiddenTags: hidden.includes(slug)
        ? hidden.filter((t) => t !== slug)
        : [...hidden, slug].slice(0, MAX_HIDDEN_TAGS),
    });
  }

  function resetPrefs() {
    update(CUSTOMIZATION_DEFAULTS);
  }

  return (
    <CustomizationContext.Provider
      value={{
        ...prefs,
        sync,
        update,
        setAccent: (accent: AccentColor) => update({ accent }),
        setFont: (font: FontOption) => update({ font }),
        setLayout: (layout: LayoutOption) => update({ layout }),
        setRadius: (radius: RadiusOption) => update({ radius }),
        applyPreset,
        toggleStat,
        toggleTag,
        resetPrefs,
        setHideNsfw: (hideNsfw: boolean) => update({ hideNsfw }),
        setBlurNsfw: (blurNsfw: boolean) => update({ blurNsfw }),
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}
