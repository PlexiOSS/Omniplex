import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { Partner } from "@/lib/api/types";
import { partnerAvatarUrl } from "@/lib/utils/assets";

interface PartnersMarqueeProps {
  partners: Partner[];
  rows?: number;
}

const MIN_PER_ROW = 5;

function splitRows<T>(items: T[], rowCount: number): T[][] {
  const out: T[][] = Array.from({ length: rowCount }, () => []);
  items.forEach((item, i) => {
    out[i % rowCount].push(item);
  });
  return out;
}

function PartnerCard({
  partner,
  hidden,
}: {
  partner: Partner;
  hidden?: boolean;
}) {
  return (
    <Link
      href="/partners"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
      className="group flex shrink-0 items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-4 py-3 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      <Avatar src={partnerAvatarUrl(partner.id)} alt={partner.name} size={28} />
      <span className="text-sm font-medium whitespace-nowrap text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
        {partner.name}
      </span>
      {partner.type && <Badge variant="info">{partner.type}</Badge>}
    </Link>
  );
}

function MarqueeRow({
  partners,
  reverse,
  delay,
}: {
  partners: Partner[];
  reverse: boolean;
  delay: number;
}) {
  const track = [...partners, ...partners];
  const duration = Math.max(partners.length * 4, 20);

  return (
    <div className="marquee -mx-4 px-4 sm:-mx-6 sm:px-6">
      <div
        className="marquee-track gap-4"
        style={
          {
            "--marquee-duration": `${duration}s`,
            animationDirection: reverse ? "reverse" : "normal",
            animationDelay: `-${delay}s`,
          } as React.CSSProperties
        }
      >
        {track.map((partner, i) => (
          <PartnerCard
            key={`${partner.id}-${i}`}
            partner={partner}
            hidden={i >= partners.length}
          />
        ))}
      </div>
    </div>
  );
}

export function PartnersMarquee({ partners, rows = 2 }: PartnersMarqueeProps) {
  let rowCount = rows;
  while (rowCount > 1 && partners.length / rowCount < MIN_PER_ROW) {
    rowCount--;
  }

  if (partners.length / rowCount <= 4) {
    return (
      <div className="flex flex-wrap gap-4">
        {partners.map((partner) => (
          <PartnerCard key={partner.id} partner={partner} />
        ))}
      </div>
    );
  }

  const partnerRows = splitRows(partners, rowCount);

  return (
    <div className="space-y-4">
      {partnerRows.map((rowPartners, rowIndex) => (
        <MarqueeRow
          key={rowIndex}
          partners={rowPartners}
          reverse={rowIndex % 2 === 1}
          delay={rowIndex * 3}
        />
      ))}
    </div>
  );
}
