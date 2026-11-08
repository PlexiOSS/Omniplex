import { describe, expect, test } from "bun:test";
import type { AppQuestion } from "./api/types";
import { checkAnswer, questionVisible } from "./appQuestions";

const base: AppQuestion = {
  id: "q",
  question: "Q",
  paragraph: "",
  placeholder: "",
  short: false,
};

describe("checkAnswer", () => {
  const cases: [string, AppQuestion, string, boolean][] = [
    ["legacy short", { ...base, short: true }, "hi", true],
    ["legacy long too short", base, "too short", false],
    ["legacy long", base, "a".repeat(60), true],
    [
      "custom min",
      { ...base, type: "long", min_length: 10 },
      "ten chars!",
      true,
    ],
    ["custom max", { ...base, type: "short", max_length: 5 }, "toolong", false],
    ["choice", { ...base, type: "choice", options: ["A", "B"] }, "B", true],
    [
      "choice not offered",
      { ...base, type: "choice", options: ["A", "B"] },
      "C",
      false,
    ],
    [
      "multi",
      { ...base, type: "multi", options: ["Go", "Rust"] },
      "Go\nRust",
      true,
    ],
    [
      "multi repeated",
      { ...base, type: "multi", options: ["Go", "Rust"] },
      "Go\nGo",
      false,
    ],
    ["yes", { ...base, type: "yesno" }, "Yes", true],
    ["number", { ...base, type: "number" }, "1250", true],
    ["not a number", { ...base, type: "number" }, "lots", false],
    ["url", { ...base, type: "url" }, "https://github.com/omniplex", true],
    ["bad url", { ...base, type: "url" }, "github.com", false],
    ["rating", { ...base, type: "rating" }, "4", true],
    ["rating out of range", { ...base, type: "rating" }, "6", false],
  ];
  for (const [name, q, answer, ok] of cases) {
    test(name, () => {
      expect(checkAnswer(q, answer) === null).toBe(ok);
    });
  }
});

describe("questionVisible", () => {
  const q: AppQuestion = {
    ...base,
    show_if: { question_id: "langs", values: ["Go"] },
  };
  test("hidden without the answer", () => {
    expect(questionVisible(q, { langs: "Rust" })).toBe(false);
  });
  test("shown when picked among others", () => {
    expect(questionVisible(q, { langs: "Rust\nGo" })).toBe(true);
  });
});
