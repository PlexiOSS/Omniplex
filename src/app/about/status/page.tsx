import { CheckCircle, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { auth, blogs, bots, list, packs, search, servers } from "@/lib/api";
import { BASE_URL, CDN_URL } from "@/lib/api/config";
import { arcadia } from "@/lib/arcadia/client";
import { ARCADIA_PANEL_SCOPE } from "@/lib/arcadia/config";
import { SOCIAL_LINKS } from "@/lib/social";

export const metadata: Metadata = {
  title: "Status",
  description: "Current operational status of Omniplex services.",
};

export const revalidate = 60;

interface ServiceStatus {
  name: string;
  ok: boolean;
  ms: number;
  detail: string;
}

async function timedCheck(fn: () => Promise<unknown>) {
  const start = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - start };
  } catch {
    return { ok: false, ms: Date.now() - start };
  }
}

export default async function StatusPage() {
  const [
    api,
    botListings,
    serverListings,
    packListings,
    blogService,
    searchService,
    discordAuth,
    cdn,
    staffPanel,
  ] = await Promise.all([
    timedCheck(() => list.getStats()),
    timedCheck(() => bots.getAll(1)),
    timedCheck(() => servers.getAll(1)),
    timedCheck(() => packs.getAll(1)),
    timedCheck(() => blogs.getAll()),
    timedCheck(() =>
      search.search({ query: "", target_types: ["bot", "server"] }),
    ),
    timedCheck(() => auth.getOAuthMeta()),
    timedCheck(async () => {
      const res = await fetch(CDN_URL, {
        method: "HEAD",
        cache: "no-store",
      });
      if (res.status >= 500) throw new Error("CDN unreachable");
    }),
    timedCheck(() => arcadia.auth.begin(ARCADIA_PANEL_SCOPE, BASE_URL)),
  ]);

  const services: ServiceStatus[] = [
    {
      name: "API",
      ...api,
      detail: api.ok ? "All systems operational" : "Unable to reach backend",
    },
    {
      name: "Assets",
      ...cdn,
      detail: cdn.ok ? "Assets serving normally" : "May be affected",
    },
    {
      name: "Bot Listings",
      ...botListings,
      detail: botListings.ok ? "Serving normally" : "Degraded",
    },
    {
      name: "Server Listings",
      ...serverListings,
      detail: serverListings.ok ? "Serving normally" : "Degraded",
    },
    {
      name: "Pack Listings",
      ...packListings,
      detail: packListings.ok ? "Serving normally" : "Degraded",
    },
    {
      name: "Blog Service",
      ...blogService,
      detail: blogService.ok ? "Serving normally" : "Degraded",
    },
    {
      name: "Search Service",
      ...searchService,
      detail: searchService.ok ? "Serving normally" : "Degraded",
    },
    {
      name: "Discord Auth",
      ...discordAuth,
      detail: discordAuth.ok ? "Discord OAuth operational" : "May be affected",
    },
    {
      name: "Staff Panel",
      ...staffPanel,
      detail: staffPanel.ok ? "Panel API reachable" : "May be affected",
    },
  ];

  const allOk = services.every((s) => s.ok);
  const checkedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date());

  return (
    <Container className="py-16">
      <div className="max-w-xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            Platform Status
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Live operational status, refreshed every 60 seconds.
          </p>
        </div>

        {/* Overall banner */}
        <div
          className={[
            "mb-8 rounded-2xl border px-5 py-4 text-center text-sm font-medium",
            allOk
              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400",
          ].join(" ")}
        >
          {allOk
            ? "All systems operational"
            : "Some services are experiencing issues"}
        </div>

        {/* Service list */}
        <div className="border divide-y divide-zinc-200 rounded-2xl border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {services.map((service) => (
            <div
              key={service.name}
              className="flex items-center justify-between gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {service.name}
                </p>
                <p className="text-xs text-zinc-400 dark:text-zinc-600">
                  {service.detail}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-xs text-zinc-400 dark:text-zinc-600">
                  {service.ms}ms
                </span>
                {service.ok ? (
                  <CheckCircle size={18} className="text-emerald-500" />
                ) : (
                  <XCircle size={18} className="text-red-500" />
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-center text-zinc-400 dark:text-zinc-600">
          Status is determined by live availability checks against each service.
          Last checked {checkedAt} UTC.
        </p>

        <p className="mt-2 text-xs text-center text-zinc-400 dark:text-zinc-600">
          Does something look wrong?{" "}
          <a
            href={SOCIAL_LINKS.discord}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-accent underline-offset-2"
          >
            Let us know on Discord
          </a>
          .
        </p>
      </div>
    </Container>
  );
}
