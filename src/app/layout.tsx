import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora, Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { CustomizationProvider } from "@/components/providers/CustomizationProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BASE_URL } from "@/lib/api/config";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const lora = Lora({ variable: "--font-lora", subsets: ["latin"] });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });

// Runs before React hydrates to prevent accent/font flash
const INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('omniplex-prefs')||'{}');if(p.accent)document.documentElement.dataset.accent=p.accent;if(p.font)document.documentElement.dataset.font=p.font;}catch(e){}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Omniplex — Discord Bot List",
    template: "%s — Omniplex",
  },
  description:
    "Discover and add the best Discord bots and servers. Vote, review, and explore thousands of bots.",
  openGraph: {
    siteName: "Omniplex",
    type: "website",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${jakarta.variable}`}
      suppressHydrationWarning
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {/* Prevent accent/font flash before hydration */}
        <script dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }} />
        <ThemeProvider>
          <CustomizationProvider>
            <Header />
            <main className="flex flex-1 flex-col">{children}</main>
            <Footer />
          </CustomizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
