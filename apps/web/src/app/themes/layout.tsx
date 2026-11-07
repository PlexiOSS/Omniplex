import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Themes",
  description:
    "Two-colour Discord profile themes submitted by the community. Click one to copy its colours.",
};

export default function ThemesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
