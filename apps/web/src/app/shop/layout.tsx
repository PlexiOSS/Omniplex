import type { Metadata } from "next";
import { ShopTabs } from "./ShopTabs";

export const metadata: Metadata = {
  title: { default: "Shop", template: "%s | Omniplex" },
  description:
    "Premium, Auto-vote, the credit shop and booster perks for your Discord bots and servers.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ShopTabs />
      {children}
    </>
  );
}
