import { Omi, type OmiMood } from "@omniplex/ui/Omi";
import { OmniplexLogo } from "@omniplex/ui/OmniplexLogo";
import { Check, Palette, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  BOT_NAMES,
  BotAvatar,
  BotBanner,
  type BotKind,
} from "@/components/brand/BotAvatar";
import { BrandAsset } from "@/components/brand/BrandAsset";
import { OmiAvatar } from "@/components/brand/OmiAvatar";
import { OmiBanner } from "@/components/brand/OmiBanner";
import { OmiLink } from "@/components/brand/OmiLink";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { CopyColorButton } from "@/components/themes/CopyColorButton";

export const metadata: Metadata = {
  title: "Brand kit",
  description:
    "The Omniplex logo, Omi the cat, our colours and type, with SVG and PNG downloads.",
  alternates: { canonical: "/brand" },
};

const MOODS: { mood: OmiMood; label: string }[] = [
  { mood: "happy", label: "Omi, happy" },
  { mood: "joy", label: "Omi, joy" },
  { mood: "wave", label: "Omi, waving" },
  { mood: "sleepy", label: "Omi, sleepy" },
  { mood: "confused", label: "Omi, confused" },
  { mood: "party", label: "Omi, party" },
];

const COLOURS = [
  {
    name: "Indigo",
    hex: "#6366f1",
    use: "The accent: buttons, links, the logo's crescent and Omi's ears.",
  },
  { name: "Night", hex: "#09090b", use: "Dark backgrounds." },
  { name: "Charcoal", hex: "#27272a", use: "Cards on dark, and Omi's fur." },
  { name: "Paper", hex: "#fafafa", use: "Light backgrounds and text on dark." },
  {
    name: "Pink",
    hex: "#f472b6",
    use: "Omi's nose. Use sparingly for highlights.",
  },
];

const DOS = [
  "Use the logo as it is, on a plain dark or light background.",
  "Give it room: at least the height of the crescent on every side.",
  "Use Omi to make an empty or friendly moment feel welcoming.",
  "Link back to omniplex.gg when you write about us.",
];

const DONTS = [
  "Stretch, rotate, recolour or add effects to the logo.",
  "Redraw Omi, change Omi's colours or put words in Omi's mouth.",
  "Use the logo or Omi in a way that suggests we endorse you.",
  "Use Omi for anything adult, hateful or misleading.",
  "Make Omi the face of another bot, including your own.",
];

const BOTS: { kind: BotKind; lines: string[]; tagline: string }[] = [
  {
    kind: "servers",
    lines: ["Omniplex", "Servers"],
    tagline: "List your server on Omniplex",
  },
  { kind: "staff", lines: ["Arcadia"], tagline: "The Omniplex staff bot" },
];

const section = "scroll-mt-24";
const sectionTitle =
  "text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50";
const sectionLead = "mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400";

export default function BrandPage() {
  return (
    <Container className="py-10">
      <PageHeader
        icon={Palette}
        title="Brand kit"
        description="Our logo, Omi the cat, and our colours and type. Use them when you write about Omniplex or link to us. Everything downloads as SVG or PNG."
      />

      <div className="space-y-14">
        <section id="logo" className={section}>
          <h2 className={sectionTitle}>Logo</h2>
          <p className={sectionLead}>
            The round mark with the indigo crescent. Use the dark version on
            light backgrounds and the light version on dark ones.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <BrandAsset
              name="omniplex-logo-light"
              label="Logo for dark backgrounds"
              ink="#fafafa"
              background="#09090b"
            >
              <OmniplexLogo size={140} className="text-zinc-50" />
            </BrandAsset>
            <BrandAsset
              name="omniplex-logo-dark"
              label="Logo for light backgrounds"
              ink="#09090b"
              background="#fafafa"
            >
              <OmniplexLogo size={140} className="text-zinc-950" />
            </BrandAsset>
            <BrandAsset
              name="omi-app-icon"
              label="App icon"
              background="#6366f1"
            >
              <Omi
                mood="happy"
                crop="head"
                size={150}
                fur="#18181b"
                accent="#c7d2fe"
              />
            </BrandAsset>
            <BrandAsset name="omi-avatar" label="Avatar" bleed>
              <OmiAvatar className="h-full w-full" />
            </BrandAsset>
          </div>
        </section>

        <section id="banner" className={section}>
          <h2 className={sectionTitle}>Profile banner</h2>
          <p className={sectionLead}>
            Omi&apos;s Discord banner, made to go with the Avatar above. The PNG
            is 1360 by 480, twice Discord&apos;s 680 by 240, so it stays sharp.
          </p>
          <div className="mt-5">
            <BrandAsset
              name="omi-banner"
              label="Omi banner"
              width={1360}
              height={480}
              bleed
            >
              <OmiBanner className="h-full w-full" />
            </BrandAsset>
          </div>
        </section>

        <section id="bots" className={section}>
          <h2 className={sectionTitle}>Our other bots</h2>
          <p className={sectionLead}>
            Omi is only ever Omi. Omniplex Servers and Arcadia wear the logo in
            their own colour, with a badge for what they do, so you can tell the
            three apart at a glance.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_2.833fr]">
            {BOTS.map((b) => (
              <div key={b.kind} className="contents">
                <BrandAsset
                  name={`${b.kind === "staff" ? "arcadia" : "omniplex-servers"}-avatar`}
                  label={`${BOT_NAMES[b.kind]} avatar`}
                  bleed
                >
                  <BotAvatar kind={b.kind} className="h-full w-full" />
                </BrandAsset>
                <BrandAsset
                  name={`${b.kind === "staff" ? "arcadia" : "omniplex-servers"}-banner`}
                  label={`${BOT_NAMES[b.kind]} banner`}
                  width={1360}
                  height={480}
                  bleed
                >
                  <BotBanner
                    kind={b.kind}
                    lines={b.lines}
                    tagline={b.tagline}
                    className="h-full w-full"
                  />
                </BrandAsset>
              </div>
            ))}
          </div>
        </section>

        <section id="omi" className={section}>
          <h2 className={sectionTitle}>Omi</h2>
          <p className={sectionLead}>
            Omi is the Omniplex cat. These come with a transparent background.{" "}
            <Link href="/about/omi" className="text-accent hover:underline">
              Meet Omi
            </Link>{" "}
            to see when each mood is used.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MOODS.map((m) => (
              <BrandAsset key={m.mood} name={`omi-${m.mood}`} label={m.label}>
                <OmiLink>
                  <Omi mood={m.mood} size={200} accent="#6366f1" />
                </OmiLink>
              </BrandAsset>
            ))}
          </div>
        </section>

        <section id="colours" className={section}>
          <h2 className={sectionTitle}>Colours</h2>
          <p className={sectionLead}>
            Indigo is our accent. Everything else is built from a dark and light
            neutral.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COLOURS.map((c) => (
              <div
                key={c.hex}
                className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div
                  className="h-24 border-b border-zinc-200 dark:border-zinc-800"
                  style={{ background: c.hex }}
                />
                <div className="space-y-2 p-4">
                  <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                    {c.name}
                  </p>
                  <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                    {c.use}
                  </p>
                  <CopyColorButton label={c.name} color={c.hex} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="type" className={section}>
          <h2 className={sectionTitle}>Type</h2>
          <p className={sectionLead}>
            We set everything in Geist, with Geist Mono for code and numbers
            that need to line up. Both are free from Vercel.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Geist
              </p>
              <p className="mt-3 font-(family-name:--font-geist-sans) text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                Find your next bot
              </p>
              <p className="mt-2 font-(family-name:--font-geist-sans) text-sm text-zinc-600 dark:text-zinc-300">
                Headings, body text and buttons.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Geist Mono
              </p>
              <p className="mt-3 font-(family-name:--font-geist-mono) text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                /vote 1,284
              </p>
              <p className="mt-2 font-(family-name:--font-geist-mono) text-sm text-zinc-600 dark:text-zinc-300">
                Commands, IDs, colours and counts.
              </p>
            </div>
          </div>
        </section>

        <section id="usage" className={section}>
          <h2 className={sectionTitle}>Using them</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Please do
              </p>
              <ul className="mt-3 space-y-2.5">
                {DOS.map((d) => (
                  <li
                    key={d}
                    className="flex gap-2.5 text-sm text-zinc-600 dark:text-zinc-300"
                  >
                    <Check
                      size={16}
                      className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Please don&apos;t
              </p>
              <ul className="mt-3 space-y-2.5">
                {DONTS.map((d) => (
                  <li
                    key={d}
                    className="flex gap-2.5 text-sm text-zinc-600 dark:text-zinc-300"
                  >
                    <X
                      size={16}
                      className="mt-0.5 shrink-0 text-red-600 dark:text-red-400"
                    />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Need something that isn&apos;t here, like a larger file or a
            partnership graphic?{" "}
            <Link href="/tickets/new" className="text-accent hover:underline">
              Open a ticket
            </Link>{" "}
            and we&apos;ll help.
          </p>
        </section>
      </div>
    </Container>
  );
}
