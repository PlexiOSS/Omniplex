import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New support ticket",
  robots: { index: false, follow: false },
};

export default function TicketsNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
