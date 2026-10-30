import "./global.css";
import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://docs.omniplex.gg";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Omniplex Documentation",
    template: "%s - Omniplex Docs",
  },
  description:
    "Guides and reference for building on Omniplex, the Discord bot and server listing platform.",
  openGraph: {
    siteName: "Omniplex Docs",
    type: "website",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
