import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bot settings",
  robots: { index: false, follow: false },
};

export default function DashboardBotsIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
