import { beforeEach, describe, expect, test } from "bun:test";
import { allowUpload, resetUploadLimits } from "./uploadLimit";

describe("upload limit", () => {
  beforeEach(() => resetUploadLimits());

  test("stops a user after 300 uploads in an hour", () => {
    const now = Date.now();
    for (let i = 0; i < 300; i++) expect(allowUpload("a", now)).toBe(true);
    expect(allowUpload("a", now)).toBe(false);
    expect(allowUpload("b", now)).toBe(true);
  });

  test("lets them upload again once the hour has passed", () => {
    const now = Date.now();
    for (let i = 0; i < 300; i++) allowUpload("a", now);
    expect(allowUpload("a", now + 60 * 60 * 1000 + 1)).toBe(true);
  });
});
