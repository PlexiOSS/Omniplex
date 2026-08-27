import { client } from "../client";
import type { ItemList, ShopItem, ShopItemBenefit, ShopPurchase, TargetType } from "../types";

export const shopResource = {
  getItems: () =>
    client.get<ItemList<ShopItem>>("/shop/items", { cache: "no-store" }),

  getBenefits: () =>
    client.get<ItemList<ShopItemBenefit>>("/shop/item-benefits", {
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
  ) =>
    client.post<void>(
      `/${targetType}/${targetId}/shop/purchase`,
      { item_id: itemId },
      { token },
    ),
};
