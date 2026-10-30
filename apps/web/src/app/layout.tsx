import type { Metadata } from "next";
import {
  Atkinson_Hyperlegible,
  DM_Sans,
  Geist,
  Geist_Mono,
  IBM_Plex_Sans,
  Inter,
  Lora,
  Manrope,
  Nunito,
  Outfit,
  Plus_Jakarta_Sans,
  Space_Grotesk,
} from "next/font/google";
import { headers } from "next/headers";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { HideOnAdmin } from "@/components/layout/HideOnAdmin";
import { CustomizationProvider } from "@/components/providers/CustomizationProvider";
import { SoundPlayerProvider } from "@/components/providers/SoundPlayerProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { JsonLd } from "@/components/seo/JsonLd";
import { SoundPlayerBar } from "@/components/sounds/SoundPlayerBar";
import { BASE_URL } from "@/lib/api/config";
import { SOCIAL_LINKS } from "@/lib/social";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  preload: false,
});
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  preload: false,
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  preload: false,
});
const grotesk = Space_Grotesk({
  variable: "--font-grotesk",
  subsets: ["latin"],
  preload: false,
});
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  preload: false,
});
const dmSans = DM_Sans({
  variable: "--font-dmsans",
  subsets: ["latin"],
  preload: false,
});
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  preload: false,
});
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  preload: false,
});
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  preload: false,
});
const atkinson = Atkinson_Hyperlegible({
  variable: "--font-atkinson",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

// Runs before React hydrates to prevent accent/font flash
const INIT_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem('omniplex-prefs')||'{}');var el=document.documentElement;if(p.accent)el.dataset.accent=p.accent;if(p.font)el.dataset.font=p.font;if(p.layout)el.dataset.layout=p.layout;if(p.radius)el.dataset.radius=p.radius;el.dataset.hiddenStats=(Array.isArray(p.hiddenStats)?p.hiddenStats:['invites','shards']).join(' ');el.dataset.hideNsfw=String(!!p.hideNsfw);var blur=p.blurNsfw===undefined?true:p.blurNsfw;el.dataset.blurNsfw=String(blur&&!p.hideNsfw);}catch(e){}})()`;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Omniplex: Discord Bot List and Server List",
    template: "%s — Omniplex",
  },
  description:
    "Find the best Discord bots and servers on Omniplex, the community-driven Discord bot list. Browse by tag, read reviews, vote for your favourites and add bots in one click.",
  applicationName: "Omniplex",
  keywords: [
    "discord bot list",
    "discord bots",
    "discord server list",
    "discord servers",
    "top discord bots",
    "best discord bots",
    "discord bot directory",
    "add discord bot",
    "discord emojis",
    "discord stickers",
    "omniplex",
  ],
  openGraph: {
    siteName: "Omniplex",
    type: "website",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} ${jakarta.variable} ${inter.variable} ${grotesk.variable} ${outfit.variable} ${dmSans.variable} ${manrope.variable} ${nunito.variable} ${plex.variable} ${atkinson.variable}`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-950 antialiased dark:bg-zinc-950 dark:text-zinc-50">
        {/* Prevent accent/font flash before hydration */}
        <script
          nonce={nonce}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static first-paint preferences script
          dangerouslySetInnerHTML={{ __html: INIT_SCRIPT }}
        />
        <JsonLd
          nonce={nonce}
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": `${BASE_URL}/#website`,
                name: "Omniplex",
                alternateName: [
                  "Omniplex Discord Bot List",
                  "Infinity Bot List",
                ],
                url: BASE_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
              },
              {
                "@type": "Organization",
                "@id": `${BASE_URL}/#organization`,
                name: "Omniplex",
                url: BASE_URL,
                logo: `${BASE_URL}/brand/logo/omniplex-app-icon-1024.png`,
                sameAs: Object.values(SOCIAL_LINKS),
              },
            ],
          }}
        />
        <ThemeProvider nonce={nonce}>
          <CustomizationProvider>
            <SoundPlayerProvider>
              <Header />
              <main className="flex flex-1 flex-col">{children}</main>
              <HideOnAdmin>
                <Footer />
              </HideOnAdmin>
              <SoundPlayerBar />
            </SoundPlayerProvider>
          </CustomizationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
