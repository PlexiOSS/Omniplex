import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Server settings",
  robots: { index: false, follow: false },
};

export default function DashboardServersIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
