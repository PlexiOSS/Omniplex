import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/commands" },
  title: "Command Directory",
  description:
    "Search every Discord bot's documented slash commands on Omniplex and find which bots have the command you need.",
};

export default function CommandsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
