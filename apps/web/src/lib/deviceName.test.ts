import { describe, expect, test } from "bun:test";
import { deviceLabel, parseDevice } from "./deviceName";

describe("parseDevice", () => {
  test("reads the old format and drops the browser version", () => {
    const d = parseDevice("Chrome (on Windows 157.0.0.0) [mobile: false]");
    expect(d).toEqual({ browser: "Chrome", os: "Windows", mobile: false });
    expect(deviceLabel(d)).toBe("Chrome on Windows");
  });

  test("old format on a phone", () => {
    expect(parseDevice("Safari (on iOS 27.0) [mobile: true]")).toEqual({
      browser: "Safari",
      os: "iOS",
      mobile: true,
    });
  });

  test("reads the new format", () => {
    expect(parseDevice("Firefox on Android")).toEqual({
      browser: "Firefox",
      os: "Android",
      mobile: true,
    });
    expect(parseDevice("Edge on macOS").mobile).toBe(false);
  });

  test("handles missing names", () => {
    expect(deviceLabel(parseDevice(null))).toBe("Unknown browser");
  });
});
