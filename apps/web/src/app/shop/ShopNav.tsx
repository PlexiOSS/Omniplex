"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { productFor, SHOP_PRODUCTS } from "./products";
import { ShopProductCard } from "./ShopProductCard";

export function ShopBreadcrumb() {
  const product = productFor(usePathname());
  if (!product) return null;
  const Icon = product.icon;

  return (
    <Container className="pt-6">
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400"
      >
        <Link
          href="/shop"
          className="transition-colors hover:text-zinc-950 dark:hover:text-zinc-50"
        >
          Shop
        </Link>
        <ChevronRight size={14} className="text-zinc-300 dark:text-zinc-600" />
        <span
          aria-current="page"
          className="inline-flex items-center gap-1.5 font-medium text-zinc-950 dark:text-zinc-50"
        >
          <Icon size={14} />
          {product.name}
        </span>
      </nav>
    </Container>
  );
}

export function MoreFromShop() {
  const current = productFor(usePathname());
  if (!current) return null;
  const others = SHOP_PRODUCTS.filter((p) => p.id !== current.id);

  return (
    <section className="border-t border-zinc-200 py-12 dark:border-zinc-800">
      <Container>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            More from the shop
          </h2>
          <Link href="/shop" className="text-sm text-accent hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {others.map((product) => (
            <ShopProductCard key={product.id} product={product} compact />
          ))}
        </div>
      </Container>
    </section>
  );
}
