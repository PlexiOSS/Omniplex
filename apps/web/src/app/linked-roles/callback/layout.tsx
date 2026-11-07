import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Linking roles",
  robots: { index: false, follow: false },
};

export default function LinkedRolesCallbackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
