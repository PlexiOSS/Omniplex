import { ShieldAlert, ShieldCheck } from "lucide-react";
import {
  noAdminReportUrl,
  readInvitePermissions,
} from "@/lib/utils/invitePermissions";

interface InvitePermissionNoteProps {
  invite: string;
}

export function InvitePermissionNote({ invite }: InvitePermissionNoteProps) {
  const perms = readInvitePermissions(invite);
  if (!perms) return null;

  const report = noAdminReportUrl(invite);

  if (perms.administrator) {
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3 py-2 text-xs">
        <p className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
          <ShieldAlert size={13} />
          Requests Administrator
        </p>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          You can untick it on Discord&apos;s invite screen and grant only what
          the bot needs.{" "}
          <a
            href={report}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            See the full report
          </a>
        </p>
      </div>
    );
  }

  return (
    <a
      href={report}
      target="_blank"
      rel="noopener noreferrer"
      title="View this bot's invite permissions on noadmin.info"
      className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100"
    >
      <ShieldCheck
        size={13}
        className="text-emerald-600 dark:text-emerald-400"
      />
      Doesn&apos;t request Administrator · {perms.count} permission
      {perms.count === 1 ? "" : "s"}
    </a>
  );
}
