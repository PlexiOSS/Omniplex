import { payments } from "@omniplex/core/api";
import type { PlanList } from "@omniplex/core/api/types";
import { formatCents } from "@omniplex/core/promo";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SHOP_PRODUCTS, type ShopProduct } from "./products";
import { ShopProductCard } from "./ShopProductCard";

function priceFor(
  product: ShopProduct,
  plans: PlanList | null,
): { price: string | null; note?: string } {
  switch (product.id) {
    case "premium": {
      const cheapest = plans?.plans.length
        ? Math.min(...plans.plans.map((p) => p.price))
        : null;
      return cheapest == null
        ? { price: null }
        : { price: `$${cheapest.toFixed(2)}`, note: "from, one-off" };
    }
    case "auto-vote":
      return plans?.auto_vote
        ? { price: formatCents(plans.auto_vote.price_cents), note: "a month" }
        : { price: null };
    case "items":
      return { price: "Credits", note: "earned from votes" };
    case "booster":
      return { price: "Free", note: "with a server boost" };
  }
}

export default async function ShopPage() {
  const plans = await payments.getPlans().catch(() => null);

  return (
    <Container className="py-12">
      <div className="max-w-2xl">
        <p className="text-sm font-medium text-accent">Shop</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          Grow your listing, and never miss a vote
        </h1>
        <p className="mt-3 text-base text-zinc-600 dark:text-zinc-300">
          Premium for your bots and servers, Auto-vote for the ones you love,
          perks you can buy with the credits your votes earn, and a thank you
          for boosting our Discord.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {SHOP_PRODUCTS.map((product) => {
          const { price, note } = priceFor(product, plans);
          return (
            <ShopProductCard
              key={product.id}
              product={product}
              price={price}
              priceNote={note}
            />
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck size={15} className="text-emerald-500" />
          Secure checkout with Stripe or PayPal
        </span>
        <span>Gift premium to any listing</span>
        <span>Cancel subscriptions anytime</span>
        <Link
          href="/kb/premium/premium"
          className="text-accent hover:underline"
        >
          How payments work
        </Link>
      </div>
    </Container>
  );
}
