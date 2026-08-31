// Copyright (C) 2026 NodeByte LTD 
export type TargetType = "Bot" | "Server" | "Team" | "Pack" | "User";

export const AUTH_VERSION = 5;
export const HELLO_VERSION = 5;

export type AuthorizeAction =
  | { Begin: { scope: string; redirect_url: string } }
  | { CreateSession: { code: string; redirect_url: string } }
  | { CheckMfaState: { login_token: string } }
  | { ResetMfaTotp: { login_token: string; otp: string } }
  | { ActivateSession: { login_token: string; otp: string } }
  | { Logout: { login_token: string } };

export interface StartAuth {
  login_url: string;
  scope: string;
  response_scope: string;
}

export interface MfaLoginSecret {
  secret: string;
  otp_url: string;
  qr_code: string;
}

export interface MfaLogin {
  info: MfaLoginSecret | null;
}

export interface AuthData {
  user_id: string;
  created_at: number;
  state: "pending" | "active" | string;
}

export interface PlatformUser {
  id: string;
  username: string;
  avatar: string;
  display_name: string;
  bot: boolean;
  status: string;
}

export interface Link {
  name: string;
  value: string;
}

export interface StaffPosition {
  id: string;
  name: string;
  role_id: string;
  perms: string[];
  corresponding_roles: Link[];
  icon: string;
  index: number;
  created_at: string;
}

export interface StaffDisciplinaryType {
  id: string;
  name: string;
  description: string;
  self_assignable: boolean;
  perm_limits: string[];
  additory: boolean;
  needs_approval: boolean;
  max_expiry: number | null;
  created_at: string;
}

export interface StaffDisciplinary {
  id: string;
  user_id: string;
  created_at: string;
  expires_at: number | null;
  title: string;
  description: string;
  type: StaffDisciplinaryType;
}

export interface StaffMember {
  user_id: string;
  user: PlatformUser;
  positions: StaffPosition[];
  disciplinaries: StaffDisciplinary[];
  perm_overrides: string[];
  /** Fully resolved kittycat permission strings ("namespace.perm") */
  resolved_perms: string[];
  no_autosync: boolean;
  unaccounted: boolean;
  mfa_verified: boolean;
  created_at: string;
  /**
   * The index of this member's most senior held position, lower being more
   * senior — mirrors Go's perms.StaffGrants.Rank() exactly. An instance
   * owner gets a very large negative number (outranks every position
   * without holding one); a member with no positions gets a very large
   * positive number (outranked by every position). Compare a position's
   * own `index` against this directly rather than re-deriving a "lowest
   * held index" from `positions` — an owner holding none would otherwise
   * look, incorrectly, like they rank below everyone.
   */
  rank: number;
}

export interface InstanceConfig {
  description: string;
  warnings: string[];
}

export interface PanelServers {
  main: string;
  staff: string;
  testing: string;
}

export interface CoreConstants {
  frontend_url: string;
  infernoplex_url: string;
  cdn_url: string;
  popplio_url: string;
  htmlsanitize_url: string;
  servers: PanelServers;
}

export interface Hello {
  instance_config: InstanceConfig;
  auth_data: AuthData;
  staff_member: StaffMember;
  core_constants: CoreConstants;
  target_types: TargetType[];
}

// --- Analytics ------------------------------------------------------------

export interface BaseAnalytics {
  bot_counts: Record<string, number>;
  server_counts: Record<string, number>;
  ticket_counts: Record<string, number>;
  total_users: number;
  changelogs_count: number;
}

// --- Bot queue ----------------------------------------------------------------

export interface PartialBot {
  bot_id: string;
  client_id: string;
  user: PlatformUser;
  short: string;
  type: string;
  votes: number;
  shards: number;
  library: string;
  invite_clicks: number;
  clicks: number;
  servers: number;
  claimed_by: string | null;
  last_claimed: string | null;
  approval_note: string;
  mentionable: string[];
  invite: string;
  moderation_flagged: boolean;
  moderation_categories: string[];
}

export interface PartialServer {
  server_id: string;
  name: string;
  avatar: string;
  total_members: number;
  online_members: number;
  short: string;
  type: string;
  votes: number;
  invite_clicks: number;
  clicks: number;
  nsfw: boolean;
  discord_nsfw_level: number;
  nsfw_channel_count: number;
  tags: string[];
  premium: boolean;
  claimed_by: string | null;
  last_claimed: string | null;
  approval_note: string;
  mentionable: string[];
  moderation_flagged: boolean;
  moderation_categories: string[];
}

export interface PartialPack {
  url: string;
  name: string;
  short: string;
  pack_type: string;
  owner: PlatformUser;
  votes: number;
  tags: string[];
  vote_banned: boolean;
}

export interface PartialTeam {
  id: string;
  name: string;
  short: string;
  votes: number;
  tags: string[];
  nsfw: boolean;
  vote_banned: boolean;
}

export interface PartialUser {
  user: PlatformUser;
  staff: boolean;
  banned: boolean;
  vote_banned: boolean;
}

export type PartialEntity =
  | { Bot: PartialBot }
  | { Server: PartialServer }
  | { Pack: PartialPack }
  | { Team: PartialTeam }
  | { User: PartialUser };

// --- RPC ------------------------------------------------------------------

/** Every RPCMethod variant Arcadia supports. Phase 1 only exposes Claim/Unclaim/Approve/Deny in the UI. */
export type RPCMethod =
  | { Claim: { target_id: string; force: boolean } }
  | { Unclaim: { target_id: string; reason: string } }
  | { Approve: { target_id: string; reason: string } }
  | { Deny: { target_id: string; reason: string } }
  | { Unverify: { target_id: string; reason: string } }
  | {
      PremiumAdd: {
        target_id: string;
        reason: string;
        time_period_hours: number;
      };
    }
  | { PremiumRemove: { target_id: string; reason: string } }
  | { VoteBanAdd: { target_id: string; reason: string } }
  | { VoteBanRemove: { target_id: string; reason: string } }
  | { VoteReset: { target_id: string; reason: string } }
  | { VoteResetAll: { reason: string } }
  | { ForceRemove: { target_id: string; reason: string; kick: boolean } }
  | { CertifyAdd: { target_id: string; reason: string } }
  | { CertifyRemove: { target_id: string; reason: string } }
  | {
      BotTransferOwnershipUser: {
        target_id: string;
        reason: string;
        new_owner: string;
      };
    }
  | {
      BotTransferOwnershipTeam: {
        target_id: string;
        reason: string;
        new_team: string;
      };
    }
  | { AppBanUser: { target_id: string; reason: string } }
  | { AppUnbanUser: { target_id: string; reason: string } };

export type RPCFieldType = "Text" | "Textarea" | "Number" | "Hour" | "Boolean";

export interface RPCField {
  id: string;
  label: string;
  field_type: RPCFieldType;
  icon: string;
  placeholder: string;
}

export interface RPCWebAction {
  id: string;
  label: string;
  description: string;
  fields: RPCField[];
  supported_target_types: TargetType[];
}

export interface RPCLogEntry {
  id: string;
  user_id: string;
  method: string;
  state: string;
  data: unknown;
  created_at: string;
}

// --- Staff positions & members (Phase 3) ---------------------------------

export type StaffPositionAction =
  | "ListPositions"
  | { SwapIndex: { a: string; b: string } }
  | { SetIndex: { id: string; index: number } }
  | {
      CreatePosition: {
        name: string;
        role_id: string;
        corresponding_roles: Link[];
        perms: string[];
        icon: string;
        index: number;
      };
    }
  | {
      EditPosition: {
        id: string;
        name: string;
        role_id: string;
        corresponding_roles: Link[];
        perms: string[];
        icon: string;
      };
    }
  | { DeletePosition: { id: string } };

export type StaffMemberAction =
  | "ListMembers"
  | {
      EditMember: {
        user_id: string;
        perm_overrides: string[];
        no_autosync: boolean;
        unaccounted: boolean;
      };
    };

export type StaffDisciplinaryTypeAction =
  | "ListDisciplinaryTypes"
  | { CreateDisciplinaryType: StaffDisciplinaryTypeUpsert }
  | { EditDisciplinaryType: StaffDisciplinaryTypeUpsert }
  | { DeleteDisciplinaryType: { id: string } };

export interface StaffDisciplinaryTypeUpsert {
  id: string;
  name: string;
  description: string;
  self_assignable: boolean;
  perm_limits: string[];
  additory: boolean;
  needs_approval: boolean;
  max_expiry: number | null;
}

// ---------------------------------------------------------------------------
// Shop admin (UpdateShopItems / UpdateShopItemBenefits / UpdateShopCoupons /
// UpdateVoteCreditTiers / UpdateBotWhitelist RPCs)
// ---------------------------------------------------------------------------

export interface ShopItemBenefit {
  id: string;
  name: string;
  description: string;
  created_at: string;
  last_updated: string;
  target_types: string[];
  created_by: string;
  updated_by: string;
}

export interface ShopItemBenefitUpsert {
  id: string;
  name: string;
  description: string;
  target_types: string[];
}

export type ShopItemBenefitAction =
  | "List"
  | { Create: ShopItemBenefitUpsert }
  | { Edit: ShopItemBenefitUpsert }
  | { Delete: { id: string } };

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  cents: number;
  target_types: string[];
  benefits: string[];
  duration: number;
  created_at: string;
  last_updated: string;
  created_by: string;
  updated_by: string;
}

export interface ShopItemUpsert {
  id: string;
  name: string;
  description: string;
  cents: number;
  target_types: string[];
  benefits: string[];
  duration: number;
}

export type ShopItemAction =
  | "List"
  | { Create: ShopItemUpsert }
  | { Edit: ShopItemUpsert }
  | { Delete: { id: string } };

export interface VoteCreditTier {
  id: string;
  target_type: string;
  position: number;
  cents: number;
  votes: number;
  created_at: string;
}

export interface VoteCreditTierUpsert {
  id: string;
  target_type: string;
  position: number;
  cents: number;
  votes: number;
}

export type VoteCreditTierAction =
  | "ListTiers"
  | { CreateTier: VoteCreditTierUpsert }
  | { EditTier: VoteCreditTierUpsert }
  | { DeleteTier: { id: string } };

export interface ShopCoupon {
  id: string;
  code: string;
  public: boolean;
  max_uses: number | null;
  created_at: string;
  created_by: string;
  last_updated: string;
  updated_by: string;
  reuse_wait_duration: number | null;
  expiry: number | null;
  applicable_items: string[];
  cents: number | null;
  requirements: string[];
  allowed_users: string[];
  usable: boolean;
  target_types: string[];
}

export interface ShopCouponUpsert {
  id: string;
  code: string;
  public: boolean;
  max_uses: number | null;
  reuse_wait_duration: number | null;
  expiry: number | null;
  applicable_items: string[];
  cents: number | null;
  requirements: string[];
  allowed_users: string[];
  usable: boolean;
  target_types: string[];
}

export type ShopCouponAction =
  | "List"
  | { Create: ShopCouponUpsert }
  | { Edit: ShopCouponUpsert }
  | { Delete: { id: string } };

export interface BotWhitelist {
  bot_id: string;
  user_id: string;
  reason: string;
  created_at: string;
}

export interface BotWhitelistUpsert {
  bot_id: string;
  reason: string;
}

export type BotWhitelistAction =
  | "List"
  | { Add: BotWhitelistUpsert }
  | { Edit: BotWhitelistUpsert }
  | { Delete: { bot_id: string } };

// ---------------------------------------------------------------------------
// Blog (UpdateBlog RPC — separate from the public Popplio blog reader)
// ---------------------------------------------------------------------------

export interface BlogPost {
  itag: string;
  slug: string;
  title: string;
  description: string;
  user_id: string;
  created_at: string;
  content: string;
  draft: boolean;
  tags: string[];
}

export type BlogAction =
  | "ListEntries"
  | { CreateEntry: BlogCreateEntry }
  | { UpdateEntry: BlogUpdateEntry }
  | { DeleteEntry: { itag: string } };

// ---------------------------------------------------------------------------
// Changelog (UpdateChangelog RPC — curated release entries for both Popplio
// and Omniplex, separate from the public GET /changelogs/@all reader)
// ---------------------------------------------------------------------------

export type ChangelogProject = "popplio" | "omniplex" | "keel";

export interface ChangelogEntry {
  itag: string;
  project: ChangelogProject;
  version: string;
  added: string[];
  updated: string[];
  fixed: string[];
  removed: string[];
  extra_description: string;
  prerelease: boolean;
  published: boolean;
  created_by: string;
  created_at: string;
}

export interface ChangelogCreateEntry {
  project: ChangelogProject;
  version: string;
  extra_description: string;
  prerelease: boolean;
  published: boolean;
  added: string[];
  updated: string[];
  fixed: string[];
  removed: string[];
  /** ISO 8601 timestamp. Omit/undefined to fall back to now (create) or
   * leave the existing date untouched (update). */
  created_at?: string;
}

export interface ChangelogUpdateEntry extends ChangelogCreateEntry {
  itag: string;
}

export interface ChangelogGenerateRequest {
  project: ChangelogProject;
  base: string;
  head: string;
}

export interface ChangelogDraft {
  added: string[];
  updated: string[];
  fixed: string[];
  removed: string[];
  extra_description: string;
}

export type ChangelogAction =
  | "ListEntries"
  | { CreateEntry: ChangelogCreateEntry }
  | { UpdateEntry: ChangelogUpdateEntry }
  | { DeleteEntry: { itag: string } }
  | { Generate: ChangelogGenerateRequest };

// ---------------------------------------------------------------------------
// Badges (UpdateBadges RPC — catalog only; assigning one to an entity goes
// through the generic AssignBadge/UnassignBadge RPCMethod instead)
// ---------------------------------------------------------------------------

export type BadgeColor =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "premium";

export interface BadgeCatalogEntry {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: BadgeColor;
  target_types: string[];
  created_at: string;
  created_by: string;
  last_updated: string;
  updated_by: string;
}

export interface BadgeUpsert {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: BadgeColor;
  target_types: string[];
}

export type BadgeAction =
  | "List"
  | { Create: BadgeUpsert }
  | { Edit: BadgeUpsert }
  | { Delete: { id: string } };

export interface StaffTemplateUpsert {
  id: string;
  name: string;
  emoji: string;
  tags: string[];
  description: string;
  type: string;
  /** "bot" or "server" — which review queue this template shows up in. */
  entity_type: "bot" | "server";
}

export type StaffTemplateAction =
  | "List"
  | { Create: StaffTemplateUpsert }
  | { Edit: StaffTemplateUpsert }
  | { Delete: { id: string } };

export interface BlogCreateEntry {
  slug: string;
  title: string;
  description: string;
  content: string;
  tags: string[];
}

export interface BlogUpdateEntry extends BlogCreateEntry {
  itag: string;
  draft: boolean;
}

// ---------------------------------------------------------------------------
// Partners
// ---------------------------------------------------------------------------

export interface Partner {
  id: string;
  name: string;
  short: string;
  links: Link[];
  bot_id: string | null;
  type: string;
  created_at: string;
  user_id: string;
}

export interface PartnerType {
  id: string;
  name: string;
  short: string;
  icon: string;
  created_at: string;
}

export interface Partners {
  partners: Partner[];
  partner_types: PartnerType[];
}

export interface PartnerUpsert {
  id: string;
  name: string;
  short: string;
  bot_id: string | null;
  links: Link[];
  type: string;
  user_id: string;
}

export type PartnerAction =
  | "List"
  | { Create: { partner: PartnerUpsert } }
  | { Update: { partner: PartnerUpsert } }
  | { Delete: { id: string } };

// ---------------------------------------------------------------------------
// Reports (UpdateReports RPC) — generic content reports, staff-only. This
// is the one place reporter identity is ever exposed; the public API never
// sends it.
// ---------------------------------------------------------------------------

export type ReportReason =
  | "license_violation"
  | "tos_violation"
  | "spam"
  | "other";

export type ReportStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface Report {
  id: string;
  target_type: string;
  target_id: string;
  target_name: string;
  target_url: string;
  reporter_id: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  resolved_by: string | null;
  resolution_note: string | null;
  created_at: string;
  resolved_at: string | null;
}

export type ReportAction =
  | { List: { status: ReportStatus | null } }
  | { Resolve: { id: string; note: string } }
  | { Dismiss: { id: string; note: string } };

// ---------------------------------------------------------------------------
// PopplioStaff — a signed reverse proxy into Popplio's own /staff/* API
// (popplio/arcadia/panel/ops_proxy.go's `popplioStaff`). Popplio's /staff/*
// routes require legacy X-Staff-Auth-Token/X-User-ID headers that neither
// Arcadia's session nor Omniplex's normal Popplio client can send directly —
// this proxy relays the request with those headers attached server-side, and
// returns Popplio's own status/body verbatim as plain text (not Arcadia's
// usual response envelope).
// ---------------------------------------------------------------------------

export interface PopplioStaffQuery {
  login_token: string;
  path: string;
  method: string;
  body: string;
}
