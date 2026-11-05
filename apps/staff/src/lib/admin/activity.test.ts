import { describe, expect, test } from "bun:test";
import {
  actorLabel,
  auditPath,
  describeAction,
  statusTone,
  targetLabel,
} from "@/lib/admin/activity";

describe("auditPath", () => {
  test("no filters", () => {
    expect(auditPath({})).toBe("/staff/audit-events");
  });

  test("trims and encodes filters", () => {
    expect(
      auditPath({
        source: "stripe",
        actorId: " 123 ",
        action: "payment.",
        failed: true,
        before: "99",
        limit: 50,
      }),
    ).toBe(
      "/staff/audit-events?source=stripe&actor_id=123&action=payment.&failed=true&before=99&limit=50",
    );
  });

  test("drops empty values", () => {
    expect(auditPath({ source: "", actorId: "  ", failed: false })).toBe(
      "/staff/audit-events",
    );
  });
});

describe("describeAction", () => {
  test("panel actions", () => {
    expect(describeAction("panel.UpdatePromoCodes.Create")).toBe(
      "Promo Codes: Create",
    );
    expect(describeAction("panel.ExecuteRpc.Approve")).toBe("Rpc: Approve");
    expect(describeAction("panel.PopplioStaff")).toBe("Popplio Staff");
  });

  test("api and system actions", () => {
    expect(describeAction("patch_bot_settings")).toBe("Patch bot settings");
    expect(describeAction("payment.refunded")).toBe("Payment refunded");
    expect(describeAction("autovote.payment_disputed")).toBe(
      "Autovote payment disputed",
    );
  });
});

describe("statusTone", () => {
  test("maps status codes", () => {
    expect(statusTone(null)).toBe("default");
    expect(statusTone(204)).toBe("success");
    expect(statusTone(403)).toBe("warning");
    expect(statusTone(500)).toBe("danger");
  });
});

describe("actorLabel", () => {
  test("labels each kind of actor", () => {
    expect(actorLabel({ actor_type: "system", actor_id: null })).toBe("System");
    expect(actorLabel({ actor_type: "anonymous", actor_id: null })).toBe(
      "Anonymous",
    );
    expect(actorLabel({ actor_type: "user", actor_id: "1" })).toBe("1");
    expect(actorLabel({ actor_type: "bot", actor_id: "2" })).toBe("bot 2");
  });

  test("prefers a resolved name", () => {
    expect(
      actorLabel({ actor_type: "user", actor_id: "1", actor_name: "Alice" }),
    ).toBe("Alice");
    expect(
      actorLabel({ actor_type: "server", actor_id: "3", actor_name: "Cafe" }),
    ).toBe("server Cafe");
  });
});

describe("targetLabel", () => {
  test("names the target when known", () => {
    expect(targetLabel({ target_type: "bot", target_id: "2" })).toBe("bot 2");
    expect(
      targetLabel({ target_type: "bot", target_id: "2", target_name: "Mee" }),
    ).toBe("bot Mee");
    expect(targetLabel({ target_type: null, target_id: null })).toBeNull();
  });
});
