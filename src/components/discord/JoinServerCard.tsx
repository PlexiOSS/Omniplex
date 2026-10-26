"use client";

import { CheckCircle2, RefreshCw } from "lucide-react";
import { BsDiscord } from "react-icons/bs";
import useSWR from "swr";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { users } from "@/lib/api";
import { SOCIAL_LINKS } from "@/lib/social";

interface JoinServerCardProps {
  required?: boolean;
  benefits?: string[];
}

const DEFAULT_BENEFITS = [
  "Hear about your review as soon as it's done",
  "Get the Bot Devs role and the developer channels",
  "Get help from staff and other developers",
];

export function useMainServerStatus() {
  const { session } = useAuth();
  const { data, isLoading, mutate, isValidating } = useSWR(
    session ? ["main-server", session.user_id, session.token] : null,
    ([, userId, token]: [string, string, string]) =>
      users.getMainServerStatus(userId, token),
    { revalidateOnFocus: true },
  );
  return {
    member: data?.member ?? null,
    loading: isLoading,
    checking: isValidating,
    recheck: () => mutate(),
  };
}

export function JoinServerCard({
  required = false,
  benefits = DEFAULT_BENEFITS,
}: JoinServerCardProps) {
  const { member, loading, checking, recheck } = useMainServerStatus();

  if (loading || member === null) return null;

  if (member) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
        <CheckCircle2 size={16} className="shrink-0" />
        You&apos;re in the Omniplex Discord server.
      </div>
    );
  }

  return (
    <div
      className={[
        "rounded-xl border p-4",
        required
          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20"
          : "border-[#5865F2]/30 bg-[#5865F2]/5",
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#5865F2] text-white">
          <BsDiscord size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {required
              ? "Join the Omniplex Discord server to apply"
              : "Join the Omniplex Discord server"}
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
            {required
              ? "This program is for members of our server."
              : "It's optional, but recommended."}
          </p>
          {!required && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
              {benefits.map((b) => (
                <li key={b}>· {b}</li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5865F2] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#4752c4]"
            >
              <BsDiscord size={13} />
              Join the server
            </a>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              loading={checking}
              onClick={recheck}
            >
              <RefreshCw size={12} />
              I&apos;ve joined, check again
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
