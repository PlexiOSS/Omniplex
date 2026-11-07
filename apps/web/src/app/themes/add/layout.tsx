import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Submit a theme",
  robots: { index: false, follow: false },
};

export default function ThemesAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
