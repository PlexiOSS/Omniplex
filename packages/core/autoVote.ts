export interface AutoVoteSchedule {
  days: number[];
  start_minute: number;
  end_minute: number;
  cooldown_until?: string | null;
  in_schedule?: boolean;
}

export function isAlways(t: AutoVoteSchedule) {
  return t.days.length === 0 && t.start_minute === 0 && t.end_minute === 1440;
}

export function waitLabel(ms: number) {
  const minutes = Math.ceil(ms / 60000);
  if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export type AutoVoteState = "unsubscribed" | "cooldown" | "outside" | "ready";

export function autoVoteState(
  t: AutoVoteSchedule,
  subscribed: boolean,
  now: number,
): { state: AutoVoteState; waitMs: number } {
  if (!subscribed) return { state: "unsubscribed", waitMs: 0 };
  const waitMs = t.cooldown_until
    ? new Date(t.cooldown_until).getTime() - now
    : 0;
  if (waitMs > 0) return { state: "cooldown", waitMs };
  if (!t.in_schedule) return { state: "outside", waitMs: 0 };
  return { state: "ready", waitMs: 0 };
}

export function voteStatus(
  t: AutoVoteSchedule,
  subscribed: boolean,
  now: number,
) {
  const { state, waitMs } = autoVoteState(t, subscribed, now);
  switch (state) {
    case "unsubscribed":
      return "Not running. Subscribe to start voting for this.";
    case "cooldown":
      return `On cooldown from your last vote. Next vote in about ${waitLabel(waitMs)}${isAlways(t) ? "." : ", if your schedule allows it then."}`;
    case "outside":
      return "Outside your schedule. It will vote when your schedule opens.";
    default:
      return "Ready. It will vote within about 5 minutes.";
  }
}
