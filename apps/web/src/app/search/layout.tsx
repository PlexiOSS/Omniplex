import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search",
  description: "Search Discord bots and servers listed on Omniplex.",
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
