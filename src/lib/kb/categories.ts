export interface KbCategoryMeta {
  slug: string;
  title: string;
  description: string;
  order: number;
}

/**
 * Category metadata lives here rather than in a content file since a
 * category isn't itself an article. Order controls display order both
 * on the KB landing page and in the sidebar nav.
 */
export const KB_CATEGORIES: KbCategoryMeta[] = [
  {
    slug: "basics",
    title: "Basics",
    description:
      "Getting started, and rules and policies for our Official Discord Server(s) and community.",
    order: 1,
  },
  {
    slug: "bots",
    title: "Bots",
    description:
      "Rules and resources for Discord bots listed on Omniplex, and the pages that represent them.",
    order: 2,
  },
  {
    slug: "servers",
    title: "Servers",
    description: "Rules and resources for Discord servers listed on Omniplex.",
    order: 3,
  },
  {
    slug: "packs",
    title: "Packs",
    description:
      "Rules and resources for bot packs — curated collections of bots grouped together.",
    order: 4,
  },
  {
    slug: "voting",
    title: "Voting",
    description:
      "How voting works on Omniplex, including cooldowns, vote weight, and abuse policy.",
    order: 5,
  },
  {
    slug: "programs",
    title: "Programs",
    description:
      "Information about Omniplex's certification and partnership programs.",
    order: 6,
  },
];
