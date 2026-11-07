import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a bot",
  robots: { index: false, follow: false },
};

export default function BotsAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
