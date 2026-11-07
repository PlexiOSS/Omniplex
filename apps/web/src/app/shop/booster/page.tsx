"use client";

import { users } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { BoosterPerks } from "@omniplex/core/api/types";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import {
  BadgeCheck,
  CircleAlert,
  ExternalLink,
  Gem,
  Repeat,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  botOption,
  EntityToggle,
  type ListingEntity,
  ListingPicker,
  serverOption,
} from "@/components/billing/ListingPicker";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/PageStates";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { SOCIAL_LINKS } from "@/lib/social";

function notApproved(type: string): string | null {
  if (type === "approved" || type === "certified") return null;
  return type === "denied" ? "Denied" : "In review";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const cardClass =
  "rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900";

export default function BoosterPerksPage() {
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const { me } = useMe(session);
  const [perks, setPerks] = useState<BoosterPerks | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entity, setEntity] = useState<ListingEntity>("bot");
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    users
      .getBoosterPerks(session.user_id, session.token)
      .then((p) => {
        setPerks(p);
        if (p.target) {
          setEntity(p.target.target_type);
          setSelected(p.target.target_id);
        }
      })
      .catch((err) =>
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load your booster perks.",
        ),
      );
  }, [session]);

  const botOptions = (me?.user_bots ?? []).map((b) =>
    botOption(b, notApproved(b.type)),
  );
  const seen = new Set<string>();
  const serverOptions = (me?.user_teams ?? [])
    .flatMap((team) => team.entities?.servers ?? [])
    .filter((s) => {
      if (seen.has(s.server_id)) return false;
      seen.add(s.server_id);
      return true;
    })
    .map((s) => serverOption(s, notApproved(s.type)));
  const options = entity === "bot" ? botOptions : serverOptions;
  const unchanged =
    perks?.target?.target_type === entity &&
    perks?.target?.target_id === selected;

  async function save(target: string | null) {
    if (!session) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const next = await users.setBoosterPerkTarget(
        session.user_id,
        target ? { target_type: entity, target_id: target } : null,
        session.token,
      );
      setPerks(next);
      if (!target) setSelected("");
      setNotice(
        next.just_applied
          ? `Saved, and ${next.target?.name || `your ${entity}`} just got ${next.premium_days} days of Bronze premium.`
          : target
            ? "Saved. Your next month goes to this listing."
            : "Your monthly premium is paused until you pick a listing.",
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save that.");
    } finally {
      setSaving(false);
    }
  }

  const perkList = [
    {
      icon: Sparkles,
      title: `${perks?.premium_days ?? 30} days of Bronze, every month`,
      body: "Premium for one of your bots or servers, renewed on its own every 30 days while you boost.",
    },
    {
      icon: Repeat,
      title: "A free Auto-vote slot",
      body: "One more listing on your Auto-vote subscription, on top of the ones you have.",
    },
    {
      icon: BadgeCheck,
      title: "Server Booster badge",
      body: "Shown on your Omniplex profile while you boost.",
    },
  ];

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Gem}
        title="Booster perks"
        description="Boosting the Omniplex Discord server helps keep the lights on. Here's what you get back."
      />

      <div className="mx-auto max-w-3xl space-y-6">
        <div className="grid gap-3 sm:grid-cols-3">
          {perkList.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Icon size={18} className="mt-0.5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {title}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {authLoading ? (
          <LoadingState />
        ) : !isAuthenticated ? (
          <section className={`${cardClass} text-center`}>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Sign in to see your booster perks.
            </p>
            <SignInLink className="mt-4 inline-block">
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInLink>
          </section>
        ) : loadError ? (
          <section className={cardClass}>
            <p className="text-sm text-red-600 dark:text-red-400">
              {loadError}
            </p>
          </section>
        ) : !perks ? (
          <LoadingState />
        ) : !perks.boosting ? (
          <section className={cardClass}>
            <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
              {perks.in_server
                ? "Boost the server to unlock these"
                : "Join and boost our Discord server"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              {perks.in_server
                ? "Open the Omniplex server in Discord and boost it. Your perks start within about 10 minutes, and we'll send you a notification."
                : "You're not in the Omniplex Discord server yet. Join it, boost it, and your perks start within about 10 minutes."}
            </p>
            {!perks.in_server && (
              <a
                href={SOCIAL_LINKS.discord}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                Join the server
                <ExternalLink size={13} />
              </a>
            )}
          </section>
        ) : (
          <section className={cardClass}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
                  Thanks for boosting!
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {perks.boosting_since
                    ? `Boosting since ${formatDate(perks.boosting_since)}.`
                    : "Your boost is active."}{" "}
                  Pick the listing your monthly premium goes to.
                </p>
              </div>
            </div>

            {perks.target && (
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
                {perks.target.avatar && (
                  <Avatar
                    src={perks.target.avatar}
                    alt={perks.target.name}
                    size={36}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {perks.target.name || perks.target.target_id}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {perks.next_renewal_at &&
                    new Date(perks.next_renewal_at) > new Date()
                      ? `Next month on ${formatDate(perks.next_renewal_at)}`
                      : "Next month is due now and is applied within 10 minutes"}
                  </p>
                </div>
              </div>
            )}

            {perks.last_error && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                <CircleAlert size={14} className="mt-0.5 shrink-0" />
                {perks.last_error}
              </p>
            )}

            <div className="mt-5 space-y-3">
              <EntityToggle
                value={entity}
                onChange={(e) => {
                  setEntity(e);
                  setSelected("");
                }}
              />
              <ListingPicker
                entity={entity}
                options={options}
                value={selected}
                onChange={setSelected}
              />
              {options.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You don&apos;t own any {entity}s yet.
                </p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                If the listing already has premium, the month is added on top.
              </p>
            </div>

            {error && (
              <p className="mt-4 text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}
            {notice && (
              <p className="mt-4 text-sm text-emerald-600 dark:text-emerald-400">
                {notice}
              </p>
            )}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {perks.target && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                  onClick={() => save(null)}
                >
                  Pause monthly premium
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                loading={saving}
                disabled={!selected || unchanged}
                onClick={() => save(selected)}
              >
                {perks.target ? "Change listing" : "Save listing"}
              </Button>
            </div>
          </section>
        )}
      </div>
    </Container>
  );
}
