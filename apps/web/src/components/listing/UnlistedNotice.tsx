import { EyeOff } from "lucide-react";

interface UnlistedNoticeProps {
  type: string;
  entityLabel: "bot" | "server";
}

export function isListed(type: string): boolean {
  return type === "approved" || type === "certified";
}

export function UnlistedNotice({ type, entityLabel }: UnlistedNoticeProps) {
  if (isListed(type)) return null;

  const message =
    type === "denied"
      ? `This ${entityLabel} was denied, so it's hidden from the public.`
      : `This ${entityLabel} is awaiting review and stays hidden from the public until it's approved.`;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
      <EyeOff size={16} className="mt-0.5 shrink-0" />
      <p>
        {message} Only its owners, team members and Omniplex staff can see this
        page. It can't receive votes, reviews or shop perks yet.
      </p>
    </div>
  );
}
