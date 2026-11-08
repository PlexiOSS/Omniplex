import type { AppQuestion, AppQuestionType } from "./api/types";

export const QUESTION_TYPES: { id: AppQuestionType; label: string }[] = [
  { id: "short", label: "Short answer" },
  { id: "long", label: "Paragraph" },
  { id: "choice", label: "Single choice" },
  { id: "multi", label: "Multiple choice" },
  { id: "yesno", label: "Yes or no" },
  { id: "number", label: "Number" },
  { id: "url", label: "Link" },
  { id: "rating", label: "Rating (1 to 5)" },
];

export function questionKind(q: AppQuestion): AppQuestionType {
  return q.type ?? (q.short ? "short" : "long");
}

export function questionChoices(q: AppQuestion): string[] {
  switch (questionKind(q)) {
    case "yesno":
      return ["Yes", "No"];
    case "rating":
      return ["1", "2", "3", "4", "5"];
    default:
      return q.options ?? [];
  }
}

export function lengthLimits(q: AppQuestion): [number, number] {
  const long = questionKind(q) === "long";
  return [
    q.min_length && q.min_length > 0 ? q.min_length : long ? 50 : 1,
    q.max_length && q.max_length > 0 ? q.max_length : long ? 10000 : 4096,
  ];
}

export function splitMulti(answer: string | undefined): string[] {
  return (answer ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function questionVisible(
  q: AppQuestion,
  answers: Record<string, string>,
): boolean {
  if (!q.show_if) return true;
  const given = splitMulti(answers[q.show_if.question_id]);
  return q.show_if.values.some((v) => given.includes(v));
}

export function checkAnswer(q: AppQuestion, raw: string): string | null {
  const answer = raw.trim();
  switch (questionKind(q)) {
    case "short":
    case "long": {
      const [lo, hi] = lengthLimits(q);
      const n = [...answer].length;
      if (n < lo) return `needs at least ${lo} characters`;
      if (n > hi) return `can be at most ${hi} characters`;
      return null;
    }
    case "choice":
    case "yesno":
    case "rating":
      return questionChoices(q).includes(answer)
        ? null
        : "pick one of the options";
    case "multi": {
      const picked = splitMulti(answer);
      if (picked.length === 0) return "pick at least one option";
      const options = q.options ?? [];
      return picked.every((p) => options.includes(p)) &&
        new Set(picked).size === picked.length
        ? null
        : "pick from the options";
    }
    case "number":
      return answer.length <= 32 && Number.isFinite(Number(answer))
        ? null
        : "needs to be a number";
    case "url":
      try {
        const u = new URL(answer);
        return (u.protocol === "https:" || u.protocol === "http:") &&
          u.host &&
          answer.length <= 500
          ? null
          : "needs to be a link starting with https://";
      } catch {
        return "needs to be a link starting with https://";
      }
  }
}

export function flaggedAnswer(q: AppQuestion, answer: string | undefined) {
  if (!q.flag?.length || !answer) return false;
  const given = splitMulti(answer);
  return q.flag.some((f) => given.includes(f));
}
