/**
 * Client-side port of Popplio's kittycat permission model. Permission strings
 * are `namespace.perm` (namespace defaults to "global" if omitted), a leading
 * `~` negates, and `*` as the perm half means "all perms in this namespace."
 * `global.*` grants everything everywhere.
 *
 * This mirrors the matching logic exactly, but is intentionally a read-only
 * client-side approximation for UI gating — every mutation still goes through
 * Popplio, which re-checks permissions server-side regardless. Getting this
 * wrong only affects which buttons are shown, not what's actually allowed.
 */

export interface Permission {
  namespace: string;
  perm: string;
  negator: boolean;
}

export function parsePermission(raw: string): Permission {
  const negator = raw.startsWith("~");
  const body = negator ? raw.slice(1) : raw;
  const dot = body.indexOf(".");
  if (dot === -1) {
    return { namespace: "global", perm: body, negator };
  }
  return {
    namespace: body.slice(0, dot),
    perm: body.slice(dot + 1),
    negator,
  };
}

function parseAll(raw: string[]): Permission[] {
  return raw.map(parsePermission);
}

/** Does this set of permission strings grant `namespace.perm`? */
export function hasPerm(
  perms: Permission[],
  target: { namespace: string; perm: string },
): boolean {
  let matched: Permission | null = null;

  for (const p of perms) {
    if (!p.negator && p.namespace === "global" && p.perm === "*") {
      return true;
    }
    if (
      (p.namespace === target.namespace || p.namespace === "global") &&
      (p.perm === "*" || p.perm === target.perm)
    ) {
      matched = p;
    }
  }

  return matched !== null && !matched.negator;
}

/** Convenience wrapper taking raw permission strings on both sides. */
export function hasPermString(perms: string[], target: string): boolean {
  return hasPerm(parseAll(perms), parsePermission(target));
}

/** True if `perms` grants every permission needed for `required` (any-of each namespace.perm pair). */
export function hasAnyPermString(perms: string[], required: string[]): boolean {
  return required.some((r) => hasPermString(perms, r));
}
