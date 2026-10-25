import { client } from "../client";
import type {
  CreateReviewPayload,
  EditReviewPayload,
  ReviewList,
  ReviewTargetType,
} from "../types";

export const reviewsResource = {
  getAll: (targetType: ReviewTargetType, targetId: string, token?: string) =>
    client.get<ReviewList>(
      `/${targetType}/${targetId}/reviews`,
      token ? { token, cache: "no-store" } : { next: { revalidate: 30 } },
    ),

  create: (
    targetType: ReviewTargetType,
    targetId: string,
    payload: CreateReviewPayload,
    token: string,
  ) =>
    client.post<void>(`/${targetType}/${targetId}/reviews`, payload, {
      token,
    }),

  edit: (
    targetType: ReviewTargetType,
    targetId: string,
    reviewId: string,
    payload: EditReviewPayload,
    token: string,
  ) =>
    client.patch<void>(
      `/${targetType}/${targetId}/reviews/${reviewId}`,
      payload,
      { token },
    ),

  remove: (
    targetType: ReviewTargetType,
    targetId: string,
    reviewId: string,
    token: string,
  ) =>
    client.delete<void>(`/${targetType}/${targetId}/reviews/${reviewId}`, {
      token,
    }),
};
