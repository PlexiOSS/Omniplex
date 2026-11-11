import { describe, expect, test } from "bun:test";
import { searchArticles, suggestArticles } from "./search";

const articles = [
  {
    slug: "voting-rules",
    category: "voting",
    categoryTitle: "Voting & Reviews",
    title: "Voting Rules & FAQ",
    description: "Cooldowns, the monthly reset and vote abuse.",
    keywords: "The monthly reset Vote cooldowns",
  },
  {
    slug: "getting-approved",
    category: "bots",
    categoryTitle: "Bots",
    title: "Getting Your Bot Approved",
    description: "What reviewers check before approving a bot.",
    keywords: "Why bots get denied Resubmitting",
  },
  {
    slug: "premium",
    category: "premium",
    categoryTitle: "Premium",
    title: "Premium",
    description: "What premium includes and how to pay.",
    keywords: "Payments Refunds",
  },
];

describe("searchArticles", () => {
  test("ranks title matches first", () => {
    expect(searchArticles(articles, "vote")[0].slug).toBe("voting-rules");
  });

  test("finds articles by their headings", () => {
    expect(searchArticles(articles, "refunds")[0].slug).toBe("premium");
  });

  test("ignores filler words", () => {
    expect(searchArticles(articles, "how do i")).toEqual([]);
  });
});

describe("suggestArticles", () => {
  test("suggests from a ticket subject", () => {
    const got = suggestArticles(
      articles,
      "My bot got denied, why wasn't it approved?",
    );
    expect(got[0]?.slug).toBe("getting-approved");
  });

  test("stays quiet when nothing matches well", () => {
    expect(
      suggestArticles(articles, "Something weird with my account"),
    ).toEqual([]);
  });
});
