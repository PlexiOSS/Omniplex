import './global.css';
import { RootProvider } from 'fumadocs-ui/provider';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://docs.omniplex.gg';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Omniplex Documentation',
    template: '%s - Omniplex Docs',
  },
  description:
    'Guides and reference for building on Omniplex, the Discord bot and server listing platform.',
  openGraph: {
    siteName: 'Omniplex Docs',
    type: 'website',
    url: BASE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen font-sans">
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
