import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a server",
  robots: { index: false, follow: false },
};

export default function ServersAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
