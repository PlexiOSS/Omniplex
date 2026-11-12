import { Omi, type OmiMood } from "@omniplex/ui/Omi";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";

export const metadata: Metadata = {
  title: "Meet Omi",
  description:
    "Omi is the Omniplex cat: curious, a little nosy, and always first to spot a new bot in the queue.",
  alternates: { canonical: "/about/omi" },
};

const MOODS: { mood: OmiMood; name: string; when: string }[] = [
  {
    mood: "happy",
    name: "Happy",
    when: "Omi's everyday face. Saying hello around the site.",
  },
  {
    mood: "joy",
    name: "Joy",
    when: "Something worked. You'll see this one right after you vote.",
  },
  {
    mood: "wave",
    name: "Waving",
    when: "Welcoming you in, whether it's your first visit or a new server.",
  },
  {
    mood: "sleepy",
    name: "Sleepy",
    when: "Nothing here yet. No notifications, no reviews, an empty list.",
  },
  {
    mood: "confused",
    name: "Confused",
    when: "Omi couldn't find what you were after, like a missing page.",
  },
  {
    mood: "party",
    name: "Party",
    when: "Big moments: going premium, getting certified, topping a leaderboard.",
  },
];

const TRAITS = ["Curious", "Helpful", "Playful", "Never in the way"];

const card =
  "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900";

export default function MeetOmiPage() {
  return (
    <Container className="py-10">
      <Link
        href="/about"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        About
      </Link>

      <section
        className={`${card} grid items-center gap-8 overflow-hidden p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]`}
      >
        <div className="flex justify-center rounded-2xl bg-[radial-gradient(circle_at_50%_45%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_70%)] py-4">
          <Omi mood="wave" size={280} />
        </div>
        <div>
          <p className="text-xs font-semibold tracking-widest text-accent uppercase">
            The Omniplex mascot
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl dark:text-zinc-50">
            Meet Omi
          </h1>
          <p className="mt-4 max-w-xl text-zinc-600 dark:text-zinc-300">
            Omi is the Omniplex cat: curious, a little nosy, and always first to
            notice a new bot in the queue. You&apos;ll find Omi wherever the
            site needs a friendly face, from empty pages and wrong turns to the
            moment your vote counts.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {TRAITS.map((t) => (
              <span
                key={t}
                className="rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent"
              >
                {t}
              </span>
            ))}
          </div>
          <p className="mt-5 text-sm text-zinc-500 dark:text-zinc-400">
            Look closely: the tag on Omi&apos;s collar is the Omniplex ring, and
            Omi&apos;s ears and tail tip match whatever accent colour
            you&apos;ve picked in Customize.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Omi&apos;s moods
        </h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Six faces for six kinds of moment.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MOODS.map((m) => (
            <div key={m.mood} className={`${card} flex items-center gap-4 p-5`}>
              <Omi mood={m.mood} size={104} className="shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                  {m.name}
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {m.when}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        className={`${card} mt-12 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:p-8`}
      >
        <Omi mood="party" crop="head" size={72} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-950 dark:text-zinc-50">
            Want Omi for a post or your server?
          </p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Every mood is in the brand kit as SVG and PNG, along with our logo
            and colours.
          </p>
        </div>
        <Link
          href="/brand"
          className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-muted"
        >
          Open the brand kit
          <ArrowRight size={14} />
        </Link>
      </section>
    </Container>
  );
}
