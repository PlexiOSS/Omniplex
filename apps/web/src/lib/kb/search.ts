export interface SearchableArticle {
  slug: string;
  category: string;
  categoryTitle: string;
  title: string;
  description: string;
  keywords?: string;
}

const STOP_WORDS = new Set(
  "a an and are as at be but by can do does for from get got have how i i'm im in into is it its me my no not of on or our so that the their them then there this to too up us was we what when where which who why will with you your help please cant can't doesnt doesn't dont don't wont won't isnt isn't".split(
    " ",
  ),
);

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .map((w) => w.replace(/'/g, ""))
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w));
}

function stem(word: string): string {
  return word.replace(/(ing|ed|es|s)$/, "") || word;
}

export function searchArticles<T extends SearchableArticle>(
  articles: T[],
  query: string,
  limit = 8,
): T[] {
  const terms = [...new Set(words(query).map(stem))];
  if (terms.length === 0) return [];
  const phrase = query.trim().toLowerCase();

  return articles
    .map((article) => {
      const title = new Set(words(article.title).map(stem));
      const description = new Set(words(article.description).map(stem));
      const keywords = new Set(
        words(`${article.keywords ?? ""} ${article.categoryTitle}`).map(stem),
      );
      let score = article.title.toLowerCase().includes(phrase) ? 6 : 0;
      for (const term of terms) {
        if (title.has(term)) score += 3;
        else if (description.has(term)) score += 2;
        else if (keywords.has(term)) score += 1;
      }
      return { article, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.article);
}

export function suggestArticles<T extends SearchableArticle>(
  articles: T[],
  text: string,
  limit = 3,
): T[] {
  const terms = [...new Set(words(text).map(stem))];
  if (terms.length < 2) return [];

  return articles
    .map((article) => {
      const title = new Set(words(article.title).map(stem));
      const description = new Set(words(article.description).map(stem));
      const keywords = new Set(words(article.keywords ?? "").map(stem));
      let score = 0;
      for (const term of terms) {
        if (title.has(term)) score += 3;
        else if (description.has(term)) score += 2;
        else if (keywords.has(term)) score += 1;
      }
      return { article, score };
    })
    .filter((r) => r.score >= 4)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.article);
}
