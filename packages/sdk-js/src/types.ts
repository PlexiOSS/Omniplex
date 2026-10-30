import type {
  IndexServer,
  Link,
  PlatformUser,
  Team,
} from "@omniplex/api-types";

export type PresenceStatus = "online" | "idle" | "dnd" | "offline";

export interface BotStats {
  servers?: number;
  shards?: number;
  users?: number;
  shardList?: number[];
  status?: PresenceStatus;
}

export interface ServerStats {
  totalMembers?: number;
  onlineMembers?: number;
}

export type WebhookProtocol = "hmac-sha256" | "splashtail" | "simple-auth";

export interface Changeset<T> {
  old: T;
  new: T;
}

export interface NewVoteData {
  votes: number;
  per_user: number;
  downvote: boolean;
  auto: boolean;
}

export interface NewReviewData {
  review_id: string;
  content: string;
  stars: number;
  owner_review: boolean;
}

export interface EditReviewData {
  review_id: string;
  stars: Changeset<number>;
  content: Changeset<string>;
  owner_review: boolean;
}

export interface DeleteReviewData {
  review_id: string;
  content: string;
  stars: number;
  owner_review: boolean;
}

export interface TeamEditData {
  name: Changeset<string>;
  short: Changeset<string>;
  tags: Changeset<string[]>;
  extra_links: Changeset<Link[]>;
  nsfw: Changeset<boolean>;
}

export interface WebhookTargets {
  bot?: PlatformUser;
  server?: IndexServer;
  team?: Team;
}

export interface WebhookMetadata {
  created_at: number;
  test: boolean;
}

interface WebhookEventOf<Type extends string, Data> {
  type: Type;
  data: Data;
  creator: PlatformUser | null;
  targets: WebhookTargets;
  metadata: WebhookMetadata;
}

export type NewVoteEvent = WebhookEventOf<"NEW_VOTE", NewVoteData>;
export type NewReviewEvent = WebhookEventOf<"NEW_REVIEW", NewReviewData>;
export type EditReviewEvent = WebhookEventOf<"EDIT_REVIEW", EditReviewData>;
export type DeleteReviewEvent = WebhookEventOf<
  "DELETE_REVIEW",
  DeleteReviewData
>;
export type TeamEditEvent = WebhookEventOf<"TEAM_EDIT", TeamEditData>;

export type WebhookEvent =
  | NewVoteEvent
  | NewReviewEvent
  | EditReviewEvent
  | DeleteReviewEvent
  | TeamEditEvent;
