import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import type { ShopProduct } from "./products";

export function ShopProductCard({
  product,
  price,
  priceNote,
  compact = false,
}: {
  product: ShopProduct;
  price?: string | null;
  priceNote?: string;
  compact?: boolean;
}) {
  const Icon = product.icon;

  return (
    <Link
      href={product.href}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-xl hover:shadow-zinc-950/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700 dark:hover:shadow-black/30"
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-24 -right-24 size-64 rounded-full bg-radial ${product.glow} to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <span
          className={`flex size-11 items-center justify-center rounded-2xl ring-1 ${product.iconTone}`}
        >
          <Icon size={20} />
        </span>
        {price && (
          <span className="text-right">
            <span className="block text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
              {price}
            </span>
            {priceNote && (
              <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                {priceNote}
              </span>
            )}
          </span>
        )}
      </div>

      <h2 className="relative mt-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        {product.name}
      </h2>
      <p className="relative mt-1 text-sm text-zinc-600 dark:text-zinc-300">
        {product.tagline}
      </p>

      {!compact && (
        <ul className="relative mt-5 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
          {product.points.map((point) => (
            <li key={point} className="flex items-start gap-2">
              <Check
                size={15}
                className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500"
              />
              {point}
            </li>
          ))}
        </ul>
      )}

      <span className="relative mt-auto inline-flex items-center gap-1 pt-6 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {product.cta}
        <ArrowRight
          size={15}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}
