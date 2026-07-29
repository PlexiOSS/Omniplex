import { arcadia } from "./client";

export interface ArcadiaPermissionEntry {
  namespace: string;
  perm: string;
  label: string;
}

/**
 * Arcadia has no equivalent of Popplio's `/teams/meta/permissions` catalog
 * endpoint — valid permission strings are scattered literal checks throughout
 * the Rust source (`has_perm(&user_perms, &"namespace.perm".into())`). This
 * list was built by grepping every such literal in d:\@plexicore\arcadia\src.
 * If Arcadia adds new permission checks, this needs a matching update — there
 * is no way to discover new ones from the API at runtime.
 *
 * `rpc.*` permissions are NOT listed here — they're fetched live from
 * GetRpcMethods (see getFullPermissionCatalog below), since that's an actual
 * live source of truth and always stays in sync with the server.
 */
export const STATIC_PERMISSION_CATALOG: ArcadiaPermissionEntry[] = [
  {
    namespace: "global",
    perm: "*",
    label: "Owner (all permissions, everywhere)",
  },
  {
    namespace: "staff_positions",
    perm: "create",
    label: "Create staff positions",
  },
  { namespace: "staff_positions", perm: "edit", label: "Edit staff positions" },
  {
    namespace: "staff_positions",
    perm: "delete",
    label: "Delete staff positions",
  },
  {
    namespace: "staff_positions",
    perm: "set_index",
    label: "Set staff position hierarchy index",
  },
  {
    namespace: "staff_positions",
    perm: "swap_index",
    label: "Swap staff position hierarchy indexes",
  },
  {
    namespace: "staff_members",
    perm: "edit",
    label: "Edit staff members (perm overrides, flags)",
  },
  {
    namespace: "staff_disciplinary_types",
    perm: "create",
    label: "Create disciplinary types",
  },
  {
    namespace: "staff_disciplinary_types",
    perm: "update",
    label: "Update disciplinary types",
  },
  {
    namespace: "staff_disciplinary_types",
    perm: "delete",
    label: "Delete disciplinary types",
  },
  { namespace: "rpc_logs", perm: "view", label: "View RPC audit logs" },
  { namespace: "blog", perm: "create_entry", label: "Create blog posts" },
  { namespace: "blog", perm: "update_entry", label: "Update blog posts" },
  { namespace: "blog", perm: "delete_entry", label: "Delete blog posts" },
  { namespace: "partners", perm: "create", label: "Create partners" },
  { namespace: "partners", perm: "update", label: "Update partners" },
  { namespace: "partners", perm: "delete", label: "Delete partners" },
  { namespace: "bot_whitelist", perm: "create", label: "Add to bot whitelist" },
  {
    namespace: "bot_whitelist",
    perm: "update",
    label: "Update bot whitelist entries",
  },
  {
    namespace: "bot_whitelist",
    perm: "delete",
    label: "Remove from bot whitelist",
  },
  {
    namespace: "vote_credit_tiers",
    perm: "create",
    label: "Create vote credit tiers",
  },
  {
    namespace: "vote_credit_tiers",
    perm: "update",
    label: "Update vote credit tiers",
  },
  {
    namespace: "vote_credit_tiers",
    perm: "delete",
    label: "Delete vote credit tiers",
  },
  { namespace: "shop_items", perm: "create", label: "Create shop items" },
  { namespace: "shop_items", perm: "update", label: "Update shop items" },
  { namespace: "shop_items", perm: "delete", label: "Delete shop items" },
  {
    namespace: "shop_item_benefits",
    perm: "create",
    label: "Create shop item benefits",
  },
  {
    namespace: "shop_item_benefits",
    perm: "update",
    label: "Update shop item benefits",
  },
  {
    namespace: "shop_item_benefits",
    perm: "delete",
    label: "Delete shop item benefits",
  },
  { namespace: "shop_coupons", perm: "list", label: "List shop coupons" },
  { namespace: "shop_coupons", perm: "create", label: "Create shop coupons" },
  { namespace: "shop_coupons", perm: "update", label: "Update shop coupons" },
  { namespace: "shop_coupons", perm: "delete", label: "Delete shop coupons" },
  { namespace: "shop_holds", perm: "create", label: "Create shop holds" },
  { namespace: "shop_holds", perm: "update", label: "Update shop holds" },
  { namespace: "shop_holds", perm: "delete", label: "Delete shop holds" },
  {
    namespace: "arcadia",
    perm: "force_refresh_top",
    label: "Force-refresh the top/leaderboard cache",
  },
  {
    namespace: "arcadia",
    perm: "leave_guilds",
    label: "Make the bot leave guilds",
  },
];

/** Static catalog plus the live rpc.* permissions (one per RPCMethod variant, always in sync with the server). */
export async function getFullPermissionCatalog(
  loginToken: string,
): Promise<ArcadiaPermissionEntry[]> {
  const rpcMethods = await arcadia.getRpcMethods(loginToken, false);
  const rpcEntries: ArcadiaPermissionEntry[] = rpcMethods.map((m) => ({
    namespace: "rpc",
    perm: m.id,
    label: m.label,
  }));
  return [...STATIC_PERMISSION_CATALOG, ...rpcEntries];
}
