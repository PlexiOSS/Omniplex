import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/shop/auto-vote" },
  title: "Auto-vote",
  description:
    "Let Omniplex vote for your favourite Discord bots and servers as soon as your cooldown ends. Monthly or yearly, with extra slots if you need more.",
};

export default function AutoVoteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
