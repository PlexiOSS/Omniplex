import { client } from "../client";
import type {
  CreateEditWebhookPayload,
  PagedResult,
  Webhook,
  WebhookLogEntry,
  WebhookTestMeta,
} from "../types";

export const webhooksResource = {
  list: (targetType: string, targetId: string, token: string) =>
    client.get<Webhook[]>(`/${targetType}/${targetId}/webhooks`, {
      token,
      cache: "no-store",
    }),

  create: (
    targetType: string,
    targetId: string,
    payload: CreateEditWebhookPayload,
    token: string,
  ) =>
    client.post<void>(`/${targetType}/${targetId}/webhooks`, payload, {
      token,
    }),

  /** Popplio's update route is POST, not PATCH, despite being an edit. */
  edit: (
    targetType: string,
    targetId: string,
    webhookId: string,
    payload: CreateEditWebhookPayload,
    token: string,
  ) =>
    client.post<void>(
      `/${targetType}/${targetId}/webhooks/${webhookId}`,
      payload,
      { token },
    ),

  delete: (
    targetType: string,
    targetId: string,
    webhookId: string,
    token: string,
  ) =>
    client.delete<void>(
      `/${targetType}/${targetId}/webhooks/${webhookId}`,
      { token },
    ),

  /** No permission required — used to populate both the event-whitelist picker and the test-send form. */
  getTestMeta: (targetType: string, targetId: string) =>
    client.get<WebhookTestMeta>(`/${targetType}/${targetId}/webhooks/test`, {
      cache: "no-store",
    }),

  /** `variables` should be `{ [variable.id]: value }` built from the selected WebhookTestType's `data`. Rate-limited to 3/min by Popplio. */
  sendTest: (
    targetType: string,
    targetId: string,
    event: string,
    variables: Record<string, unknown>,
    token: string,
  ) =>
    client.post<void>(
      `/${targetType}/${targetId}/webhooks/test?event=${encodeURIComponent(event)}`,
      variables,
      { token },
    ),

  getLogs: (targetType: string, targetId: string, page: number, token: string) =>
    client.get<PagedResult<WebhookLogEntry[]>>(
      `/${targetType}/${targetId}/webhooks/logs?page=${page}`,
      { token, cache: "no-store" },
    ),
};
