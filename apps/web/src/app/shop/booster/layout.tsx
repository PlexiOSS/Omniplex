import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Booster Perks",
  description:
    "Boost the Omniplex Discord server to get a free month of Bronze premium every 30 days, an extra Auto-vote slot and the Server Booster badge.",
};

export default function BoosterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
