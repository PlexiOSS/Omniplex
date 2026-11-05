export type AuditSource = "api" | "panel" | "system" | "stripe" | "paypal";

export interface AuditEvent {
  id: string;
  created_at: string;
  source: AuditSource;
  actor_type: string;
  actor_id: string | null;
  actor_name?: string | null;
  actor_avatar?: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_name?: string | null;
  status: number | null;
  ip: string | null;
  data: Record<string, unknown>;
}

export interface AuditEventList {
  events: AuditEvent[];
  next_before: string | null;
}

export interface AuditFilters {
  source?: AuditSource | "";
  actorId?: string;
  targetId?: string;
  action?: string;
  failed?: boolean;
  before?: string | null;
  limit?: number;
}

export const SOURCE_LABELS: Record<AuditSource, string> = {
  api: "API",
  panel: "Staff panel",
  system: "System",
  stripe: "Stripe",
  paypal: "PayPal",
};

export function auditPath(filters: AuditFilters) {
  const params = new URLSearchParams();
  if (filters.source) params.set("source", filters.source);
  if (filters.actorId?.trim()) params.set("actor_id", filters.actorId.trim());
  if (filters.targetId?.trim())
    params.set("target_id", filters.targetId.trim());
  if (filters.action?.trim()) params.set("action", filters.action.trim());
  if (filters.failed) params.set("failed", "true");
  if (filters.before) params.set("before", filters.before);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return `/staff/audit-events${query ? `?${query}` : ""}`;
}

export function statusTone(status: number | null) {
  if (status == null) return "default" as const;
  if (status >= 500) return "danger" as const;
  if (status >= 400) return "warning" as const;
  return "success" as const;
}

function words(s: string) {
  return s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_.]+/g, " ")
    .trim();
}

function sentence(s: string) {
  const w = words(s).toLowerCase();
  return w.charAt(0).toUpperCase() + w.slice(1);
}

export function describeAction(action: string) {
  if (action.startsWith("panel.")) {
    const [, query = "", variant] = action.split(".");
    const area = words(query.replace(/^(Update|Execute)/, "")) || query;
    return variant ? `${area}: ${words(variant)}` : area;
  }
  return sentence(action);
}

function withKind(type: string | null | undefined, label: string) {
  return !type || type === "user" || type === "staff"
    ? label
    : `${type} ${label}`;
}

export function actorLabel(
  event: Pick<AuditEvent, "actor_type" | "actor_id" | "actor_name">,
) {
  if (event.actor_type === "system") return "System";
  if (event.actor_name) return withKind(event.actor_type, event.actor_name);
  if (!event.actor_id)
    return event.actor_type === "staff" ? "Staff" : "Anonymous";
  return withKind(event.actor_type, event.actor_id);
}

export function targetLabel(
  event: Pick<AuditEvent, "target_type" | "target_id" | "target_name">,
) {
  if (!event.target_id) return null;
  return withKind(event.target_type, event.target_name || event.target_id);
}
