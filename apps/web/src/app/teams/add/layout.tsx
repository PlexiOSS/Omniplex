import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create a team",
  robots: { index: false, follow: false },
};

export default function TeamsAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
