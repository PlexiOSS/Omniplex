import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/packs/add" },
  title: "Create a pack",
  robots: { index: false, follow: false },
};

export default function PacksAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
