"use client";

import { Info, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useInviteCheck } from "@/hooks/useInviteCheck";
import { NOADMIN_CALCULATOR_URL, noAdminReportUrl } from "@/lib/noadmin";

interface InviteCheckProps {
  invite: string;
}

const TONES = {
  danger: "border-red-500/30 bg-red-500/[0.06] text-red-700 dark:text-red-400",
  warn: "border-amber-500/30 bg-amber-500/[0.06] text-amber-700 dark:text-amber-400",
  ok: "border-emerald-500/25 bg-emerald-500/[0.05] text-emerald-700 dark:text-emerald-400",
  muted:
    "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400",
};

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-2 hover:text-zinc-950 dark:hover:text-zinc-50"
    >
      {children}
    </a>
  );
}

function Note({
  tone,
  icon,
  title,
  children,
}: {
  tone: keyof typeof TONES;
  icon: ReactNode;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border px-3 py-2 text-xs ${TONES[tone]}`}>
      <p className="flex items-center gap-1.5 font-medium">
        {icon}
        {title}
      </p>
      {children && (
        <p className="mt-1 text-zinc-600 wrap-anywhere dark:text-zinc-400">
          {children}
        </p>
      )}
    </div>
  );
}

export function InviteCheck({ invite }: InviteCheckProps) {
  const { local, report, isDiscordInvite } = useInviteCheck(invite);
  const trimmed = invite.trim();
  if (!trimmed.startsWith("https://")) return null;

  if (!isDiscordInvite) {
    return (
      <Note tone="muted" icon={<Info size={13} />} title="Custom invite link">
        We can only check discord.com invite links automatically. Staff will
        check what this link requests during review, and bots that request
        Administrator are not accepted.
      </Note>
    );
  }

  const reportUrl = noAdminReportUrl(trimmed);

  if (local?.administrator) {
    return (
      <Note
        tone="danger"
        icon={<ShieldAlert size={13} />}
        title="This invite requests Administrator"
      >
        Omniplex doesn&apos;t accept bots that request Administrator. Remove it
        and request only the permissions your bot uses.{" "}
        <ExternalLink href={reportUrl}>
          See what this link asks for
        </ExternalLink>{" "}
        or{" "}
        <ExternalLink href={NOADMIN_CALCULATOR_URL}>
          build a new invite
        </ExternalLink>
        .
      </Note>
    );
  }

  if (!local || local.count === 0) {
    return (
      <Note
        tone="ok"
        icon={<ShieldCheck size={13} />}
        title="Requests no permissions"
      />
    );
  }

  if (
    report &&
    (report.verdict === "broad" || report.verdict === "excessive")
  ) {
    const high = report.counts.high;
    return (
      <Note
        tone="warn"
        icon={<TriangleAlert size={13} />}
        title={`No Administrator, but ${report.verdict_label.toLowerCase()}`}
      >
        This invite requests {high} high-risk permission{high === 1 ? "" : "s"}.
        That is fine if your bot uses all of them, but staff may ask about any
        it doesn&apos;t.{" "}
        <ExternalLink href={report.report_url}>See the breakdown</ExternalLink>.
      </Note>
    );
  }

  return (
    <Note
      tone="ok"
      icon={<ShieldCheck size={13} />}
      title={`Doesn't request Administrator · ${local.count} permission${local.count === 1 ? "" : "s"}`}
    >
      <ExternalLink href={report?.report_url ?? reportUrl}>
        See the breakdown on noadmin.info
      </ExternalLink>
    </Note>
  );
}
