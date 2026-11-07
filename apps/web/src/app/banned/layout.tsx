import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Banned",
  robots: { index: false, follow: false },
};

export default function BannedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
