import { client } from "../client";
import type { ReminderList } from "../types";

export const remindersResource = {
  list: (userId: string, token: string) =>
    client.get<ReminderList>(`/users/${userId}/reminders`, {
      token,
      cache: "no-store",
    }),

  create: (
    userId: string,
    targetType: "bot" | "server",
    targetId: string,
    token: string,
  ) =>
    client.put<void>(
      `/users/${userId}/${targetType}/${targetId}/reminders`,
      {},
      { token },
    ),

  remove: (
    userId: string,
    targetType: "bot" | "server",
    targetId: string,
    token: string,
  ) =>
    client.delete<void>(
      `/users/${userId}/${targetType}/${targetId}/reminders`,
      { token },
    ),
};
