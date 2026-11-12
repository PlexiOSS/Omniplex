import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Template settings",
  robots: { index: false, follow: false },
};

export default function DashboardTemplatesIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
