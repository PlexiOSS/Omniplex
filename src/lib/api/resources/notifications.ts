import { client } from "../client";
import type {
  NotifGetList,
  NotificationInfo,
  NotificationPrefs,
  UserSubscriptionPayload,
} from "../types";

export const notificationsResource = {
  getInfo: () =>
    client.get<NotificationInfo>("/users/notifications/info", {
      cache: "no-store",
    }),

  subscribe: (
    userId: string,
    token: string,
    payload: UserSubscriptionPayload,
  ) => client.post<void>(`/users/${userId}/notifications`, payload, { token }),

  listSubscriptions: (userId: string, token: string) =>
    client.get<NotifGetList>(`/users/${userId}/notifications`, {
      token,
      cache: "no-store",
    }),

  unsubscribe: (userId: string, token: string, notifId: string) =>
    client.delete<void>(
      `/users/${userId}/notification?notif_id=${encodeURIComponent(notifId)}`,
      { token },
    ),

  getPrefs: (userId: string, token: string) =>
    client.get<NotificationPrefs>(`/users/${userId}/notification-prefs`, {
      token,
      cache: "no-store",
    }),

  updatePrefs: (userId: string, token: string, patch: NotificationPrefs) =>
    client.patch<void>(`/users/${userId}/notification-prefs`, patch, {
      token,
    }),
};
