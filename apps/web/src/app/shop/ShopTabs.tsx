"use client";

import { Gem, Repeat, ShoppingBag, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/layout/Container";

const TABS = [
  { href: "/shop/premium", label: "Premium", icon: Sparkles },
  { href: "/shop/auto-vote", label: "Auto-vote", icon: Repeat },
  { href: "/shop/items", label: "Credit shop", icon: ShoppingBag },
  { href: "/shop/booster", label: "Booster perks", icon: Gem },
];

export function ShopTabs() {
  const pathname = usePathname();

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800">
      <Container>
        <nav
          aria-label="Shop"
          className="-mb-px flex gap-1 overflow-x-auto [scrollbar-width:none]"
        >
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={[
                  "flex shrink-0 items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors",
                  active
                    ? "border-accent text-zinc-950 dark:text-zinc-50"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                ].join(" ")}
              >
                <Icon size={15} className={active ? "text-accent" : ""} />
                {label}
              </Link>
            );
          })}
        </nav>
      </Container>
    </div>
  );
}
