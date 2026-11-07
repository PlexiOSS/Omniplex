import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Credit Shop",
  description:
    "Turn the votes your bot or server earns into credits and spend them on boosts, a featured homepage slot, bonus premium days and more, with no card needed.",
};

export default function CreditShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
