import type { AlertCategory } from "@/lib/api/types";

export const ALERT_CATEGORY_LABELS: Record<AlertCategory, string> = {
  votes: "Votes & Reminders",
  bot_server_reviews: "Bot & Server Reviews",
  payments: "Payments & Premium",
  shop: "Shop",
  webhooks: "Webhooks",
  staff_applications: "Staff Applications",
  reports: "Reports",
  account_security: "Account & Security",
};
