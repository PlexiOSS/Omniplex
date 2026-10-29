import { client } from "../client";
import type {
  ItemList,
  ShopCoupon,
  ShopItem,
  ShopItemBenefit,
  ShopPurchase,
  TargetType,
} from "../types";

export const shopResource = {
  getItems: () =>
    client.get<ItemList<ShopItem>>("/shop/items", { cache: "no-store" }),

  getBenefits: () =>
    client.get<ItemList<ShopItemBenefit>>("/shop/item-benefits", {
      cache: "no-store",
    }),

  /** Public, unauthenticated -- already filtered server-side to coupons
   * that are usable, not expired, and haven't hit their max uses. */
  getPublicCoupons: () =>
    client.get<ItemList<ShopCoupon>>("/shop/public-coupons", {
      cache: "no-store",
    }),

  getPurchases: (targetType: TargetType, targetId: string) =>
    client.get<ItemList<ShopPurchase>>(
      `/${targetType}/${targetId}/shop/purchases`,
      { cache: "no-store" },
    ),

  purchase: (
    targetType: TargetType,
    targetId: string,
    itemId: string,
    token: string,
    couponCode?: string,
  ) =>
    client.post<void>(
      `/${targetType}/${targetId}/shop/purchase`,
      { item_id: itemId, coupon_code: couponCode || undefined },
      { token },
    ),
};
