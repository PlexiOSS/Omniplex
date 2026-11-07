import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support ticket",
  robots: { index: false, follow: false },
};

export default function TicketsIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
