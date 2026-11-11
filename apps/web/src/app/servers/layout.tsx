import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Discord Server List",
  description:
    "Browse the Omniplex Discord server list and find a community to join, from gaming and anime to coding and art. Filter by tag, read reviews and vote for your favourites.",
  alternates: { canonical: "/servers" },
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
