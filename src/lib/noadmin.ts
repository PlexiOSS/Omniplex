export const NOADMIN_URL = "https://noadmin.info";

export type NoAdminVerdict =
  | "none"
  | "minimal"
  | "reasonable"
  | "broad"
  | "excessive"
  | "administrator";

export interface NoAdminReport {
  valid: true;
  permissions: string;
  administrator: boolean;
  verdict: NoAdminVerdict;
  verdict_label: string;
  counts: { low: number; medium: number; high: number; critical: number };
  granted: { key: string; name: string; risk: string }[];
  report_url: string;
}

export interface NoAdminInvalid {
  valid: false;
  error: string;
}

export async function analyzeInvite(
  invite: string,
): Promise<NoAdminReport | NoAdminInvalid> {
  const res = await fetch(
    `${NOADMIN_URL}/api/v1/analyze?${new URLSearchParams({ input: invite })}`,
  );
  if (!res.ok && res.status !== 400)
    throw new Error(`noadmin.info returned ${res.status}`);
  return res.json();
}

export function noAdminReportUrl(invite: string): string {
  return `${NOADMIN_URL}/analyze?${new URLSearchParams({ invite })}`;
}

export const NOADMIN_CALCULATOR_URL = `${NOADMIN_URL}/calculator`;
