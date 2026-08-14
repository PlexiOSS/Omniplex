// ---------------------------------------------------------------------------
// Platform user (from eureka/dovewing) — avatar is already a full URL
// ---------------------------------------------------------------------------

export interface PlatformUser {
  id: string;
  username: string;
  display_name: string;
  /** Fully resolved avatar URL — use directly in <img> */
  avatar: string;
  bot: boolean;
  status: "online" | "idle" | "dnd" | "offline";
  extra_data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Asset metadata — CDN-relative, resolve with resolveAsset() from utils/assets
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Links  (extra_links on bots/servers use `value` not `url`)
// ---------------------------------------------------------------------------

export interface Link {
  name: string;
  value: string;
}

// ---------------------------------------------------------------------------
// Bots
// ---------------------------------------------------------------------------

export type BotType =
  | "approved"
  | "certified"
  | "denied"
  | "banned"
  | "under_review"
  | "pending";

export interface IndexBot {
  bot_id: string;
  /** Full platform user resolved by dovewing — avatar is a full URL */
  user: PlatformUser;
  short: string;
  type: BotType;
  vanity_ref: string;
  vanity: string;
  /** Exact vote count (from entity_votes) */
  votes: number;
  /** Cached approximate votes — used for ranking/display */
  approximate_votes: number;
  shards: number;
  library: string;
  invite_clicks: number;
  clicks: number;
  servers: number;
  nsfw: boolean;
  tags: string[];
  premium: boolean;
  created_at: string;
}

export interface Bot {
  itag: string;
  bot_id: string;
  client_id: string;
  user: PlatformUser;
  owner: PlatformUser | null;
  team_owner: Team | null;
  short: string;
  /** Long description (HTML/markdown). Only present when include=long is passed */
  long: string;
  library: string;
  nsfw: boolean;
  premium: boolean;
  last_stats_post: string | null;
  servers: number;
  shards: number;
  shard_list: number[];
  users: number;
  votes: number;
  approximate_votes: number;
  clicks: number;
  unique_clicks: number;
  invite_clicks: number;
  invite: string;
  type: BotType;
  vanity_ref: string;
  vanity: string;
  vote_banned: boolean;
  /** Successful uptime checks out of total_uptime, from Popplio's periodic presence check. */
  uptime: number;
  total_uptime: number;
  /** Null if never checked yet. */
  uptime_last_checked: string | null;
  prefix: string;
  extra_links: Link[];
  tags: string[];
  cert_reason: string | null;
  captcha_opt_out: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Servers — note: servers have `name` directly (not via user)
// ---------------------------------------------------------------------------

export type ServerState = "public" | "private" | "unlisted" | "defunct";

export interface IndexServer {
  server_id: string;
  name: string;
  /** Fully resolved icon URL, synced from Infernoplex's gateway cache. Empty
   * string if the server has no icon set or hasn't been synced yet — use
   * directly in <img>, no resolveAsset() needed. */
  avatar: string;
  total_members: number;
  online_members: number;
  short: string;
  type: "approved" | "certified" | "pending";
  state: ServerState;
  vanity_ref: string;
  vanity: string;
  votes: number;
  approximate_votes: number;
  invite_clicks: number;
  clicks: number;
  nsfw: boolean;
  tags: string[];
  premium: boolean;
}

export interface Server extends IndexServer {
  long: string;
  extra_links: Link[];
  team_owner: Team | null;
  vote_banned: boolean;
  unique_clicks: number;
  /** The user ID who claimed management of this server listing, if any */
  claimed_by: string | null;
  captcha_opt_out: boolean;
  login_required_for_invite: boolean;
  /** Whether the owner has opted in to showing this server's emojis/stickers below. */
  show_emojis: boolean;
  /** Synced periodically by the tracking bot, always empty unless show_emojis is true. */
  emojis: ServerEmoji[];
  stickers: ServerSticker[];
  /** Null if never synced (e.g. the tracking bot has never been in this server). */
  emojis_synced_at: string | null;
}

export interface ServerEmoji {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}

export interface ServerSticker {
  id: string;
  name: string;
  /** "png" | "apng" | "lottie" | "gif" */
  format: string;
  url: string;
}

/** GET /servers/@emojis — minimal per-server shape for the cross-server
 * emoji/sticker browse page. Only returned for servers with
 * show_emojis=true. */
export interface ServerEmojiPreview {
  server_id: string;
  name: string;
  avatar: string;
  emojis: ServerEmoji[];
  stickers: ServerSticker[];
}

export interface TeamMember {
  itag: string;
  team_id: string;
  user: PlatformUser | null;
  flags: string[];
  service: string;
  created_at: string;
  mentionable: boolean;
  data_holder: boolean;
}

export interface TeamEntities {
  targets?: string[];
  members?: TeamMember[];
  bots?: IndexBot[];
  servers?: IndexServer[];
}

export interface Team {
  id: string;
  name: string;
  short: string;
  tags: string[];
  extra_links: Link[];
  votes: number;
  nsfw: boolean;
  vanity: string;
  /** Only present when the API resolves entities for this team (e.g. via /users/{id}) */
  entities: TeamEntities | null;
}

/** A single flat permission (e.g. "edit_servers") — from GET /teams/meta/permissions or GET /staff/meta/permissions */
export interface PermissionData {
  id: string;
  name: string;
  desc: string;
  category: string;
  dangerous?: boolean;
}

// ---------------------------------------------------------------------------
// API sessions (tokens) — GET/POST/DELETE /{target_type}/{target_id}/sessions
// ---------------------------------------------------------------------------

export interface ApiSession {
  id: string;
  /** Null for login sessions, which this UI never shows — always set for API tokens. */
  name: string | null;
  created_at: string;
  type: string;
  target_type: string;
  target_id: string;
  /** Empty means unrestricted — the token inherits whatever perms its owner has at request time. */
  perm_limits: string[];
  expiry: string;
}

export interface CreateSessionPayload {
  name: string;
  type: "api";
  perm_limits: string[];
  /** Seconds until the token expires. */
  expiry: number;
}

export interface CreateSessionResponse {
  target_id: string;
  /** Only ever returned once, at creation — Popplio never stores or re-serves the raw token. */
  token: string;
  session_id: string;
}

/** POST /auth/test — checks whether a token is valid for a given target, without spending it on a real request. */
export interface TestAuthResult {
  target_type: string;
  id: string;
  authorized: boolean;
  banned: boolean;
  data: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Webhooks — GET/POST/DELETE /{target_type}/{target_id}/webhooks[/...]
// ---------------------------------------------------------------------------

export interface Webhook {
  id: string;
  name: string;
  target_id: string;
  target_type: string;
  url: string;
  broken: boolean;
  failed_requests: number;
  /** Legacy: plain JSON + raw secret in the Authorization header. Mutually exclusive with hmac_auth. */
  simple_auth: boolean;
  /** Recommended: plain JSON + HMAC-SHA256 signature in X-Webhook-Signature. */
  hmac_auth: boolean;
  /** Empty means every event is sent. */
  event_whitelist: string[];
  created_at: string;
}

export interface CreateEditWebhookPayload {
  name: string;
  url: string;
  /** Required unless url resolves as a Discord webhook URL, in which case Popplio fills it in itself.
   * Never returned by GET — re-entering it is required on every edit too. */
  secret?: string;
  simple_auth: boolean;
  hmac_auth: boolean;
  event_whitelist: string[];
}

export interface WebhookTestVariable {
  id: string;
  name: string;
  description: string;
  value: string;
  /** "text" | "text[]" | "link[]" | "number" | "changeset" | "boolean" */
  type: string;
}

export interface WebhookTestType {
  type: string;
  data: WebhookTestVariable[] | null;
}

export interface WebhookTestMeta {
  data: WebhookTestType[];
}

export interface WebhookLogEntry {
  id: string;
  webhook_id: string;
  target_id: string;
  target_type: string;
  user: PlatformUser | null;
  url: string;
  data: Record<string, unknown>;
  response: string | null;
  created_at: string;
  state: string;
  tries: number;
  last_try: string;
  bad_intent: boolean;
  status_code: number;
  request_headers: Record<string, unknown>;
  response_headers: Record<string, unknown>;
}

export interface CreateEditTeamPayload {
  name: string;
  short?: string;
  tags?: string[];
  extra_links?: Link[];
  nsfw?: boolean;
}

export interface CreateTeamResponse {
  team_id: string;
}

export interface AddTeamMemberPayload {
  user_id: string;
  perms: string[];
}

export interface EditTeamMemberPayload {
  perms?: string[];
  mentionable?: boolean;
  data_holder?: boolean;
}

/** A user's flattened, resolved permissions on a specific entity — GET /users/{id}/{target_type}/{target_id}/perms */
export interface UserEntityPerms {
  perms: string[];
}

// ---------------------------------------------------------------------------
// Packs
// ---------------------------------------------------------------------------

export type PackType = "bot" | "server" | "emoji";

/** A single emoji in an emoji pack. No asset URL field — build it with
 * packEmojiUrl(pack.url, id, animated), same convention as bannerUrl(). */
export interface PackEmoji {
  id: string;
  name: string;
  animated: boolean;
  position: number;
}

export interface BotPack {
  owner: PlatformUser;
  name: string;
  short: string;
  votes: number;
  tags: string[];
  url: string;
  created_at: string;
  pack_type: PackType;
  /** Raw bot IDs */
  bot_ids: string[];
  /** Resolved IndexBot objects */
  bots: IndexBot[];
  /** Raw server IDs */
  server_ids: string[];
  /** Resolved IndexServer objects */
  servers: IndexServer[];
  /** Only populated for pack_type "emoji" */
  emojis: PackEmoji[];
  vote_banned: boolean;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface User {
  itag: string;
  /** Resolved Discord/platform user — may be null for deleted accounts */
  user: PlatformUser | null;
  about: string | null;
  extra_links: Link[];
  user_bots: IndexBot[];
  user_packs: BotPack[];
  user_teams: Team[];
  staff: boolean;
  bot_developer: boolean;
  certified: boolean;
  vote_banned: boolean;
  banned: boolean;
  bug_hunters: boolean;
  captcha_sponsor_enabled: boolean;
  experiments: string[];
  created_at: string;
  updated_at: string;
  last_booster_claim: string | null;
}

// ---------------------------------------------------------------------------
// Voting
// ---------------------------------------------------------------------------

export interface Vote {
  user_id: string;
  created_at: string;
}

export interface UserVote {
  has_voted: boolean;
  valid_votes: Vote[];
  vote_info: {
    multiple_votes: boolean;
    per_user: number;
    supports_downvotes: boolean;
    supports_partial_vote_credits_redeem: boolean;
    supports_upvotes: boolean;
    vote_credits: boolean;
    vote_time: number;
  } | null;
  wait: {
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

/** A proof-of-work vote captcha challenge, issued by GET /votes/captcha/challenge. */
export interface CaptchaChallenge {
  salt: string;
  difficulty: number;
  expires: number;
  signature: string;
}

/** A solved CaptchaChallenge, submitted as the body of a vote request. */
export interface CaptchaSolution extends CaptchaChallenge {
  nonce: string;
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchFilter {
  from: number;
  to: number;
}

export type TagMode = "@>" | "&&";

export interface TagFilter {
  tags: string[];
  /** "@>" = all tags must match, "&&" = any tag matches */
  tag_mode: TagMode;
}

export interface SearchQuery {
  query?: string;
  target_types: string[];
  servers?: SearchFilter;
  votes?: SearchFilter;
  shards?: SearchFilter;
  total_members?: SearchFilter;
  tags?: TagFilter;
}

export interface SearchResponse {
  target_types: string[];
  bots?: IndexBot[];
  servers?: IndexServer[];
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthSession {
  token: string;
  user_id: string;
  session_id: string;
  expires_at: number;
  avatar: string;
  username: string;
  display_name: string;
}

// ---------------------------------------------------------------------------
// User mutations
// ---------------------------------------------------------------------------

export interface UpdateUserPayload {
  about?: string | null;
  captcha_sponsor_enabled?: boolean | null;
  extra_links?: Link[];
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

export interface UserPerm {
  banned: boolean;
  captcha_sponsor_enabled: boolean;
  experiments: string[];
  staff: boolean;
  user: PlatformUser | null;
  vote_banned: boolean;
}

// ---------------------------------------------------------------------------
// Paginated responses — ALL list endpoints use this shape
// ---------------------------------------------------------------------------

export interface PagedResult<T> {
  count: number;
  per_page: number;
  results: T;
}

// ---------------------------------------------------------------------------
// Index responses
// ---------------------------------------------------------------------------

export interface ListIndexBot {
  certified: IndexBot[];
  premium: IndexBot[];
  most_viewed: IndexBot[];
  packs: BotPack[];
  recently_added: IndexBot[];
  top_voted: IndexBot[];
}

export interface ListIndexServer {
  certified: IndexServer[];
  premium: IndexServer[];
  most_viewed: IndexServer[];
  recently_added: IndexServer[];
  top_voted: IndexServer[];
}

// ---------------------------------------------------------------------------
// List-wide stats
// ---------------------------------------------------------------------------

export interface ListStats {
  total_bots: number;
  total_approved_bots: number;
  total_certified_bots: number;
  total_staff: number;
  total_users: number;
  total_votes: number;
  total_packs: number;
  total_tickets: number;
}

// ---------------------------------------------------------------------------
// Random bots / servers
// ---------------------------------------------------------------------------

export interface RandomBots {
  bots: IndexBot[];
}

export interface RandomServers {
  servers: IndexServer[];
}

// ---------------------------------------------------------------------------
// Reports — PUT /users/{uid}/{target_type}/{target_id}/reports. Individual
// reports are reviewed only through the Arcadia staff panel (see
// lib/arcadia/client.ts's `reports` namespace) — there's no public
// read-back of a filed report. GET /reports/stats is the one public,
// anonymized exception (aggregate counts only).
// ---------------------------------------------------------------------------

export type TargetType = "bot" | "server" | "pack";

export type ReportReason =
  | "license_violation"
  | "tos_violation"
  | "spam"
  | "other";

export interface CreateReportPayload {
  reason: ReportReason;
  description: string;
}

export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface ReportStatCount {
  reason: ReportReason;
  status: ReportStatus;
  count: number;
}

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export type ReviewTargetType = "bot" | "server" | "team";

export interface Review {
  id: string;
  target_type: string;
  target_id: string;
  author: PlatformUser;
  owner_review: boolean;
  content: string;
  stars: number;
  created_at: string;
  /** Null for a root review, the parent review's id otherwise. */
  parent_id: string | null;
}

export interface ReviewList {
  reviews: Review[];
}

export interface CreateReviewPayload {
  content: string;
  stars: number;
  /** Omit (or "") for a root review. */
  parent_id?: string;
  owner_review: boolean;
}

export interface EditReviewPayload {
  content: string;
  stars: number;
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

export interface PartnerType {
  id: string;
  name: string;
  short: string;
  icon: string;
  created_at: string;
}

export interface Partner {
  id: string;
  name: string;
  short: string;
  links: Link[];
  type: string;
  created_at: string;
  /** Use `user.avatar` for a partner's image — Popplio never sends a separate one. */
  user: PlatformUser | null;
  bot_id: string | null;
}

export interface PartnerList {
  partners: Partner[];
  partner_types: PartnerType[];
}

// ---------------------------------------------------------------------------
// Blog
// ---------------------------------------------------------------------------

export interface BlogListPost {
  slug: string;
  title: string;
  description: string;
  author: PlatformUser | null;
  created_at: string;
  draft: boolean;
  tags: string[];
}

export interface Blog {
  posts: BlogListPost[];
}

export interface BlogPost extends BlogListPost {
  content: string;
}

// ---------------------------------------------------------------------------
// Bot / Server creation payloads
// ---------------------------------------------------------------------------

/** PATCH /users/{uid}/bots/{bid}/teams — transfer a bot to a different team.
 * Servers have no equivalent endpoint. */
export interface PatchBotTeamPayload {
  team_id: string;
}

export interface CreateBotPayload {
  bot_id: string;
  /** Discord application ID — the same as bot_id for virtually all bots */
  client_id: string;
  /** 30-150 characters */
  short: string;
  /** At least 500 characters, HTML/markdown supported */
  long: string;
  prefix: string;
  /** Must be a valid HTTPS URL */
  invite: string;
  library: string;
  /** 1-5 tags */
  tags: string[];
  extra_links: Link[];
  nsfw?: boolean;
  /** An existing team's id to own this bot. Omit (or "") to create a new team for it. */
  team_owner?: string;
}

export interface CreateServerPayload {
  /** A Discord invite URL or bare code — the server itself is resolved from this. */
  invite: string;
  short: string;
  long: string;
  nsfw: boolean;
  tags: string[];
  extra_links: Link[];
  /** An existing team's id to own this server. Omit (or "") to create a new team for it. */
  team_owner?: string;
}

/** Preview of a bot resolved from `GET /bots/{client_id}/meta`, ahead of submitting Add Bot. */
export interface DiscordBotMeta {
  bot_id: string;
  client_id: string;
  name: string;
  avatar: string;
  /** Empty if not on the list yet. */
  list_type: string;
  guild_count: number;
  bot_public: boolean;
  flags: string[];
  description: string;
  tags: string[];
  fallback: boolean;
  fetch_errors: Record<string, string>;
}

/** Preview of a server resolved from `GET /servers/meta?invite=...`, ahead of submitting Add Server. */
export interface DiscordServerMeta {
  server_id: string;
  name: string;
  avatar: string;
  total_members: number;
  online_members: number;
  already_listed: boolean;
  list_type: string;
  bot_present: boolean;
  bot_invite_url: string;
}

// ---------------------------------------------------------------------------
// Bot / Server / Pack settings updates
// ---------------------------------------------------------------------------

export interface BotSettingsUpdate {
  short: string;
  long: string;
  prefix: string;
  invite: string;
  library: string;
  extra_links: Link[];
  tags: string[];
  nsfw: boolean;
  captcha_opt_out: boolean;
}

export interface ServerSettingsUpdate {
  short: string;
  long: string;
  extra_links: Link[];
  state: "public" | "private" | "unlisted" | "defunct";
  tags: string[];
  nsfw: boolean;
  captcha_opt_out: boolean;
  login_required_for_invite: boolean;
  show_emojis: boolean;
}

/** An emoji submitted at pack create/edit time — the image must already be
 * uploaded (via /api/uploads, kind "pack-emoji") under this same id before
 * the pack is submitted. */
export interface PackEmojiInput {
  id: string;
  name: string;
  animated: boolean;
}

export interface CreatePackPayload {
  name: string;
  url: string;
  short: string;
  tags: string[];
  pack_type: PackType;
  /** Required for pack_type "bot" */
  bots: string[];
  /** Required for pack_type "server" */
  servers: string[];
  /** Required for pack_type "emoji" */
  emojis: PackEmojiInput[];
}

export interface PackSettingsUpdate {
  name: string;
  short: string;
  tags: string[];
  /** Same per-type requirement as CreatePackPayload — pack_type itself is
   * immutable and not part of this payload. */
  bots: string[];
  servers: string[];
  emojis: PackEmojiInput[];
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  message: string;
  context?: Record<string, string>;
}
