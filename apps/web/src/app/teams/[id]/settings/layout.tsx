import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team settings",
  robots: { index: false, follow: false },
};

export default function TeamsIdSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
