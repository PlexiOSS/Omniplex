import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Emojis",
  description:
    "Browse every emoji from every Emoji Pack on Omniplex. See who made each one, which pack it's from, and download it on its own.",
};

export default function EmojisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
