import { client } from "../client";
import type {
  CreatedTicket,
  CreateTicketPayload,
  Ticket,
  TicketList,
  TicketTopicList,
} from "../types";

export const ticketsResource = {
  getTopics: () =>
    client.get<TicketTopicList>("/tickets/topics", { cache: "no-store" }),

  list: (userId: string, token: string) =>
    client.get<TicketList>(`/users/${userId}/tickets`, {
      token,
      cache: "no-store",
    }),

  get: (id: string, token: string) =>
    client.get<Ticket>(`/tickets/${id}`, { token, cache: "no-store" }),

  create: (userId: string, payload: CreateTicketPayload, token: string) =>
    client.post<CreatedTicket>(`/users/${userId}/tickets`, payload, { token }),

  reply: (id: string, content: string, token: string) =>
    client.post<void>(`/tickets/${id}/messages`, { content }, { token }),

  setOpen: (id: string, open: boolean, token: string) =>
    client.patch<void>(`/tickets/${id}`, { open }, { token }),
};
