// ---------------------------------------------------------------------------
// Hand-derived from Arcadia's Rust source (d:\@plexicore\arcadia\src\panelapi\).
// Arcadia is a *separate* backend from Popplio — its own auth, own domain,
// own (much less consistent) response envelope. See docs/admin-panel-plan.md.
//
// PanelQuery and every nested action enum serialize with serde's default
// "externally tagged" representation for struct/newtype variants:
//   SomeEnum::Variant { a, b } -> { "Variant": { "a": ..., "b": ... } }
// ---------------------------------------------------------------------------

export type TargetType = "Bot" | "Server" | "Team" | "Pack" | "User";

// --- Auth -------------------------------------------------------------------

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

// --- Staff / Hello ------------------------------------------------------------

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
  tags: string[];
  premium: boolean;
  claimed_by: string | null;
  last_claimed: string | null;
  mentionable: string[];
}

export type PartialEntity = { Bot: PartialBot } | { Server: PartialServer };

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
