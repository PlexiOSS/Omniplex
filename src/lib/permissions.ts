/**
 * Client-side mirror of Popplio's flat permission model (perms.Catalogue /
 * perms.Set). A permission is a flat, opaque name — `edit_servers`,
 * `manage_webhooks`, `review_entities` — with no namespaces, wildcards or
 * negators: a holder either has it or doesn't. Each domain declares one
 * "super" permission that implies every other one in that domain — `owner`
 * for team/entity permissions, `administrator` for staff permissions — and
 * that's the only implication in the system.
 *
 * This mirrors the matching logic exactly, but is intentionally a read-only
 * client-side approximation for UI gating — every mutation still goes through
 * Popplio, which re-checks permissions server-side regardless. Getting this
 * wrong only affects which buttons are shown, not what's actually allowed.
 */

const SUPER_PERMS = ["owner", "administrator"];

/** Is this permission id a domain's "implies everything" super permission? */
export function isSuperPerm(id: string): boolean {
  return SUPER_PERMS.includes(id);
}

/** Does this set of permission strings grant `target`? */
export function hasPermString(perms: string[], target: string): boolean {
  return perms.some((p) => SUPER_PERMS.includes(p)) || perms.includes(target);
}

/** True if `perms` grants every one of `required`. */
export function hasAllPermStrings(perms: string[], required: string[]): boolean {
  return required.every((r) => hasPermString(perms, r));
}

/** True if `perms` grants at least one of `required`. */
export function hasAnyPermString(perms: string[], required: string[]): boolean {
  return required.some((r) => hasPermString(perms, r));
}
