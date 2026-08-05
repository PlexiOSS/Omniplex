import { ExternalLink, Handshake } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { list } from "@/lib/api";
import type { Partner } from "@/lib/api/types";
import { partnerAvatarUrl } from "@/lib/utils/assets";

export const metadata: Metadata = {
  title: "Partners",
  description: "Communities and services we work with.",
};

export const revalidate = 300;

function PartnerCard({ partner }: { partner: Partner }) {
  const primaryLink = partner.links[0];

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <Avatar
          src={partnerAvatarUrl(partner.id)}
          alt={partner.name}
          size={44}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-zinc-950 dark:text-zinc-50">
              {partner.name}
            </span>
            {partner.type && <Badge variant="info">{partner.type}</Badge>}
          </div>
          {partner.user?.username && (
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              @{partner.user.username}
            </p>
          )}
        </div>
      </div>

      <p className="mt-3 line-clamp-3 flex-1 text-sm text-zinc-500 dark:text-zinc-400">
        {partner.short}
      </p>

      {partner.links.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {partner.links.map((link) => (
            <a
              key={link.name}
              href={link.value}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
            >
              <ExternalLink size={12} />
              {link.name}
            </a>
          ))}
        </div>
      )}

      {partner.bot_id && !primaryLink && (
        <Link
          href={`/bots/${partner.bot_id}`}
          className="mt-4 flex items-center gap-1.5 border-t border-zinc-100 pt-3 text-xs text-zinc-500 transition-colors hover:text-accent dark:border-zinc-800 dark:text-zinc-400"
        >
          <ExternalLink size={12} />
          View bot
        </Link>
      )}
    </div>
  );
}

export default async function PartnersPage() {
  const data = await list.getPartners().catch(() => null);
  const partners = data?.partners ?? [];
  const partnerTypes = data?.partner_types ?? [];

  const groups = partnerTypes
    .map((type) => ({
      type,
      partners: partners.filter((p) => p.type === type.id),
    }))
    .filter((g) => g.partners.length > 0);

  const ungrouped = partners.filter(
    (p) => !partnerTypes.some((t) => t.id === p.type),
  );

  return (
    <Container className="py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Handshake size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Partners
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Communities and services we work with.
        </p>
      </div>

      {partners.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No partners listed right now.
        </p>
      ) : (
        <div className="space-y-10">
          {groups.map(({ type, partners: typePartners }) => (
            <section key={type.id}>
              <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {type.name}
              </h2>
              {type.short && (
                <p className="-mt-3 mb-4 text-sm text-zinc-500 dark:text-zinc-400">
                  {type.short}
                </p>
              )}
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
                <h2 className="mb-4 text-base font-semibold text-zinc-950 dark:text-zinc-50">
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
    </Container>
  );
}
