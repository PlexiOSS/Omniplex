import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bots",
  description:
    "Browse thousands of Discord bots. Filter by category, vote for your favorites, and add them to your server.",
};

export default function BotsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
