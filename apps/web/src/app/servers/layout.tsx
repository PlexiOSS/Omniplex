import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Servers",
  description:
    "Browse Discord servers listed on Omniplex. Find a community to join and vote for your favorites.",
};

export default function ServersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
