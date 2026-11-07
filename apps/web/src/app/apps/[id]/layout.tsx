import { apps } from "@omniplex/core/api";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const meta = await apps.getMeta().catch(() => null);
  const position = meta?.positions.find((p) => p.id === id);
  if (!position) return { title: "Apply" };
  return {
    title: `Apply: ${position.name}`,
    description: `Apply for ${position.name} on Omniplex.`,
    robots: position.hidden ? { index: false, follow: false } : undefined,
  };
}

export default function ApplyPositionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
