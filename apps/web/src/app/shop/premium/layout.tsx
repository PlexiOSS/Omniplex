import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium",
  description:
    "Upgrade your Discord bot or server with Omniplex Premium: a highlighted listing, a place at the top of search, and more. Longer plans cost less per month.",
};

export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
