import { ArrowRight, BookOpen, Handshake } from "lucide-react";
import Link from "next/link";
import { PackCard } from "@/components/cards/PackCard";
import { HomeTabs } from "@/components/home/HomeTabs";
import { PartnersMarquee } from "@/components/home/PartnersMarquee";
import { RotatingWord } from "@/components/home/RotatingWord";
import { StatsBar } from "@/components/home/StatsBar";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { SearchBar } from "@/components/search/SearchBar";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { blogs, bots, list, servers } from "@/lib/api";
import type { Blog, ListStats, PartnerList } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

export default async function HomePage() {
  let botIndex = null;
  let serverIndex = null;
  let stats: ListStats | null = null;
  let partnerList: PartnerList | null = null;
  let blogData: Blog | null = null;

  try {
    // getIndex() calls are critical — any failure means the page can't render.
    // Secondary calls (stats, partners, blogs) are non-critical; swallow their errors.
    [botIndex, serverIndex] = await Promise.all([
      bots.getIndex(),
      servers.getIndex(),
    ]);
    [stats, partnerList, blogData] = (await Promise.allSettled([
      list.getStats(),
      list.getPartners(),
      blogs.getAll(),
    ]).then((results) =>
      results.map((r) => (r.status === "fulfilled" ? r.value : null)),
    )) as [ListStats | null, PartnerList | null, Blog | null];
  } catch (err) {
    // Any error from the index endpoints — including 500 DB failures — means
    // the service is unavailable. Show the unavailable UI regardless of status.
    return <ServiceUnavailable />;
  }

  const tabs = [
    {
      key: "top_voted",
      label: "Top Voted",
      bots: botIndex?.top_voted ?? [],
      servers: serverIndex?.top_voted ?? [],
    },
    {
      key: "most_viewed",
      label: "Most Viewed",
      bots: botIndex?.most_viewed ?? [],
      servers: serverIndex?.most_viewed ?? [],
    },
    {
      key: "recently_added",
      label: "New",
      bots: botIndex?.recently_added ?? [],
      servers: serverIndex?.recently_added ?? [],
    },
  ].filter((t) => t.bots.length > 0 || t.servers.length > 0);

  const highlightsTabs = [
    {
      key: "certified",
      label: "Certified",
      bots: botIndex?.certified ?? [],
      servers: serverIndex?.certified ?? [],
    },
    {
      key: "premium",
      label: "Premium",
      bots: botIndex?.premium ?? [],
      servers: serverIndex?.premium ?? [],
    },
  ].filter((t) => t.bots.length > 0 || t.servers.length > 0);

  const featuredTabs = [
    {
      key: "featured",
      label: "Featured",
      bots: botIndex?.featured ?? [],
      servers: serverIndex?.featured ?? [],
    },
  ].filter((t) => t.bots.length > 0 || t.servers.length > 0);

  const spotlightTabs = [
    {
      key: "spotlight",
      label: "Spotlight",
      bots: botIndex?.spotlight ?? [],
      servers: serverIndex?.spotlight ?? [],
    },
  ].filter((t) => t.bots.length > 0 || t.servers.length > 0);

  const packs = botIndex?.packs ?? [];
  const recentPosts = (blogData?.posts ?? [])
    .filter((p) => !p.draft)
    .slice(0, 3);
  const partners = partnerList?.partners ?? [];

  return (
    <>
      {/* Hero */}
      <section className="border-b border-zinc-200 bg-zinc-50 py-20 dark:border-zinc-800 dark:bg-zinc-900/50">
        <Container>
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl sm:whitespace-nowrap dark:text-zinc-50">
              Discover the <span className="text-accent">best</span> Discord{" "}
              <RotatingWord
                words={["bots", "servers", "packs"]}
                className="text-accent"
              />
            </h1>
            <p className="mt-4 text-lg text-zinc-500 dark:text-zinc-400">
              Explore thousands of bots and servers. Vote, review, and find
              exactly what your server needs.
            </p>
            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <SearchBar
                navigate
                placeholder="Search bots and servers..."
                className="w-full max-w-md"
              />
              <Link
                href="/bots"
                className="inline-flex items-center gap-2 whitespace-nowrap text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                Browse all <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured bots and servers (purchased homepage slot) */}
      {featuredTabs.length > 0 && (
        <section className="border-b border-accent/10 bg-linear-to-b from-accent/6 to-transparent py-14 dark:border-accent/10 dark:from-accent/8">
          <Container>
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Featured
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Purchased homepage placements, bots and servers alike
            </p>
            <div className="mt-6">
              <HomeTabs tabs={featuredTabs} />
            </div>
          </Container>
        </section>
      )}

      {/* Main tabbed bot grid */}
      {tabs.length > 0 && (
        <section className="py-14">
          <Container>
            <HomeTabs tabs={tabs} showRandom />
          </Container>
        </section>
      )}

      {/* Spotlight: hand-picked by staff, bots and servers */}
      {spotlightTabs.length > 0 && (
        <section className="border-t border-accent/10 bg-linear-to-b from-accent/6 to-transparent py-14 dark:border-accent/10 dark:from-accent/8">
          <Container>
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Spotlight
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Hand-picked by our staff, bots and servers alike
            </p>
            <div className="mt-6">
              <HomeTabs tabs={spotlightTabs} />
            </div>
          </Container>
        </section>
      )}

      {/* Highlights: certified & premium, bots and servers */}
      {highlightsTabs.length > 0 && (
        <section className="border-t border-zinc-200 py-14 dark:border-zinc-800">
          <Container>
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
              Highlights
            </h2>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Certified and premium listings, bots and servers alike
            </p>
            <div className="mt-6">
              <HomeTabs tabs={highlightsTabs} />
            </div>
          </Container>
        </section>
      )}

      {/* Packs (bot, server, or emoji) */}
      {packs.length > 0 && (
        <section className="border-t border-zinc-200 py-14 dark:border-zinc-800">
          <Container>
            <SectionHeader
              title="Packs"
              subtitle="Curated collections of bots, servers, and emojis"
              href="/packs"
            />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {packs.slice(0, 9).map((pack) => (
                <PackCard key={pack.url} pack={pack} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Partners */}
      {partners.length > 0 && (
        <section className="border-t border-zinc-200 py-14 dark:border-zinc-800">
          <Container>
            <div className="flex items-center gap-2">
              <Handshake size={16} className="text-zinc-400" />
              <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                Partners
              </h2>
            </div>
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              Trusted communities and services we work with
            </p>
            <div className="mt-6">
              <PartnersMarquee partners={partners} />
            </div>
          </Container>
        </section>
      )}

      {/* Blog / news */}
      {recentPosts.length > 0 && (
        <section className="border-t border-zinc-200 py-14 dark:border-zinc-800">
          <Container>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <BookOpen size={16} className="text-zinc-400" />
                <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
                  News &amp; Updates
                </h2>
              </div>
              <Link
                href="/blog"
                className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                All posts <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40"
                >
                  {post.tags.length > 0 && (
                    <div className="mb-3 flex gap-1.5">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="info">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <h3 className="font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                    {post.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {post.description}
                  </p>
                  <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-zinc-400 dark:text-zinc-600">
                    {post.author && (
                      <>
                        <Avatar
                          src={post.author.avatar}
                          alt={post.author.username}
                          size={18}
                        />
                        <span>
                          {post.author.display_name || post.author.username}
                        </span>
                        <span>·</span>
                      </>
                    )}
                    <span>{formatRelativeTime(post.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Empty state */}
      {tabs.length === 0 &&
        featuredTabs.length === 0 &&
        spotlightTabs.length === 0 &&
        highlightsTabs.length === 0 &&
        packs.length === 0 && (
          <section className="py-24">
            <Container>
              <div className="flex flex-col items-center justify-center text-center">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No bots listed yet. Be the first to{" "}
                  <Link
                    href="/bots/add"
                    className="underline underline-offset-2"
                  >
                    add one
                  </Link>
                  .
                </p>
              </div>
            </Container>
          </section>
        )}
    </>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
}: {
  title: string;
  subtitle?: string;
  href: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {subtitle}
          </p>
        )}
      </div>
      <Link
        href={href}
        className="flex shrink-0 items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        View all <ArrowRight size={14} />
      </Link>
    </div>
  );
}
