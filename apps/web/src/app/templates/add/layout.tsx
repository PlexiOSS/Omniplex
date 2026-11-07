import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add a template",
  robots: { index: false, follow: false },
};

export default function TemplatesAddLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
