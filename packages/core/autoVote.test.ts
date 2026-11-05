import { describe, expect, test } from "bun:test";
import { autoVoteState, isAlways, voteStatus, waitLabel } from "./autoVote";

const always = { days: [], start_minute: 0, end_minute: 1440 };
const weekdays = { days: [1, 2, 3, 4, 5], start_minute: 540, end_minute: 1320 };
const now = Date.parse("2026-11-04T16:00:00Z");

describe("isAlways", () => {
  test("only the full window with no days is always", () => {
    expect(isAlways(always)).toBe(true);
    expect(isAlways(weekdays)).toBe(false);
    expect(isAlways({ ...always, end_minute: 1439 })).toBe(false);
  });
});

describe("waitLabel", () => {
  test("rounds up to whole minutes", () => {
    expect(waitLabel(30_000)).toBe("1 minute");
    expect(waitLabel(59 * 60_000)).toBe("59 minutes");
    expect(waitLabel(3 * 3_600_000 + 12 * 60_000)).toBe("3h 12m");
  });
});

describe("autoVoteState", () => {
  test("not subscribed wins over everything", () => {
    expect(
      autoVoteState(
        { ...always, cooldown_until: "2026-11-05T00:00:00Z" },
        false,
        now,
      ).state,
    ).toBe("unsubscribed");
  });

  test("cooldown in the future", () => {
    const res = autoVoteState(
      { ...always, cooldown_until: "2026-11-04T19:12:00Z", in_schedule: true },
      true,
      now,
    );
    expect(res.state).toBe("cooldown");
    expect(res.waitMs).toBe(3 * 3_600_000 + 12 * 60_000);
  });

  test("an ended cooldown counts as ready", () => {
    expect(
      autoVoteState(
        {
          ...always,
          cooldown_until: "2026-11-04T15:00:00Z",
          in_schedule: true,
        },
        true,
        now,
      ).state,
    ).toBe("ready");
  });

  test("outside the schedule", () => {
    expect(
      autoVoteState({ ...weekdays, in_schedule: false }, true, now).state,
    ).toBe("outside");
  });
});

describe("voteStatus", () => {
  test("schedule note only for scheduled listings", () => {
    const cooldown = "2026-11-04T17:00:00Z";
    expect(voteStatus({ ...always, cooldown_until: cooldown }, true, now)).toBe(
      "On cooldown from your last vote. Next vote in about 1h 0m.",
    );
    expect(
      voteStatus({ ...weekdays, cooldown_until: cooldown }, true, now),
    ).toContain("if your schedule allows it then");
  });
});
