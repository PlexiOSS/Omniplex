import { BASE_URL } from "@omniplex/core/api/config";
import { ThemeProvider } from "@omniplex/ui/ThemeProvider";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { StaffHeader } from "@/components/StaffHeader";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: { default: "Omniplex Staff", template: "%s | Omniplex Staff" },
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        <ThemeProvider nonce={nonce}>
          <StaffHeader />
          <main className="flex flex-1 flex-col">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
