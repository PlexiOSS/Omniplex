import { ArrowRight, ExternalLink, Handshake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { BsDiscord } from "react-icons/bs";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { list } from "@/lib/api";
import type { Partner, PartnerList } from "@/lib/api/types";
import { partnerLogoUrl } from "@/lib/utils/assets";

export const metadata: Metadata = {
  title: "Partners",
  description: "The bots, communities and services we work with.",
};

const TYPE_ORDER = ["bot", "featured", "botlist", "hosting"];

function isDiscordUrl(url: string): boolean {
  return /discord\.(gg|com|io)|discordapp\.com/i.test(url);
}

function PartnerCard({ partner }: { partner: Partner }) {
  const isListedBot = !!partner.bot_id && !!partner.bot;

  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <Avatar src={partnerLogoUrl(partner)} alt={partner.name} size={48} />
        <div className="min-w-0 flex-1">
          {isListedBot ? (
            <Link
              href={`/bots/${partner.bot_id}`}
              className="block truncate font-semibold text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50"
            >
              {partner.name}
            </Link>
          ) : (
            <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
              {partner.name}
            </p>
          )}
          {partner.user && (
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
              by {partner.user.display_name || partner.user.username}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
        {partner.short}
      </p>

      {(isListedBot || partner.links.length > 0) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {isListedBot && (
            <Link
              href={`/bots/${partner.bot_id}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              View on Omniplex <ArrowRight size={12} />
            </Link>
          )}
          {partner.links.map((link) => {
            const discord = isDiscordUrl(link.value);
            return (
              <a
                key={link.name}
                href={link.value}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
              >
                {discord ? <BsDiscord size={12} /> : <ExternalLink size={12} />}
                {link.name}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

function typeRank(id: string): number {
  const i = TYPE_ORDER.indexOf(id);
  return i === -1 ? TYPE_ORDER.length : i;
}

export default async function PartnersPage() {
  let data: PartnerList | null = null;
  let failed = false;
  try {
    data = await list.getPartners();
  } catch {
    failed = true;
  }
  const partners = data?.partners ?? [];
  const partnerTypes = [...(data?.partner_types ?? [])].sort(
    (a, b) => typeRank(a.id) - typeRank(b.id),
  );

  const groups = partnerTypes
    .map((type) => ({
      type,
      partners: partners
        .filter((p) => p.type === type.id)
        .sort((a, b) => Number(!!b.bot) - Number(!!a.bot)),
    }))
    .filter((g) => g.partners.length > 0);

  const ungrouped = partners.filter(
    (p) => !partnerTypes.some((t) => t.id === p.type),
  );

  return (
    <Container className="py-16">
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Handshake size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Partners
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The bots, communities and services we work with. Bots are the heart of
          Omniplex, so our bot partners come first.
        </p>
      </div>

      {failed ? (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          Couldn&apos;t load our partners right now. Check back shortly.
        </p>
      ) : partners.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No partners listed right now.
        </p>
      ) : (
        <div className="space-y-12">
          {groups.map(({ type, partners: typePartners }) => (
            <section key={type.id}>
              <div className="mb-4 flex items-baseline justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {type.name}
                  </h2>
                  {type.short && (
                    <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                      {type.short}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-zinc-400 dark:text-zinc-500">
                  {typePartners.length}
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {typePartners.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </section>
          ))}

          {ungrouped.length > 0 && (
            <section>
              {groups.length > 0 && (
                <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                  Other Partners
                </h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ungrouped.map((partner) => (
                  <PartnerCard key={partner.id} partner={partner} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <section className="mx-auto mt-16 max-w-3xl rounded-2xl border border-accent/20 bg-accent/5 p-6 text-center">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Want to partner with us?
        </h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          We partner with bots, communities and services that are genuinely
          active, whatever their size. Read what we look for, then apply.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/apps"
            className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-muted"
          >
            Apply to partner
          </Link>
          <Link
            href="/kb/programs/partnership"
            className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm font-medium text-zinc-600 transition-colors hover:text-accent dark:text-zinc-300"
          >
            Partner requirements <ArrowRight size={14} />
          </Link>
        </div>
      </section>
    </Container>
  );
}
