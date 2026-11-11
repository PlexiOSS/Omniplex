import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/feed" },
  title: "Feed",
  description:
    "The latest updates Discord bot owners have posted on Omniplex, newest first.",
};

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
