import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Stickers",
  description:
    "Browse every sticker from every Sticker Pack on Omniplex. See who made each one, which pack it's from, and download it on its own.",
};

export default function StickersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
