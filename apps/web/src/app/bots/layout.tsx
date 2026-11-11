import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discord Bot List",
  description:
    "Browse the Omniplex Discord bot list: moderation, music, games, economy and more. Filter by tag, read reviews, vote for your favourites and add them to your server.",
  alternates: { canonical: "/bots" },
};

export default function BotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
