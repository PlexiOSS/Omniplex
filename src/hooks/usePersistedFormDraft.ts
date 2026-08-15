"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "omniplex:draft:";

function draftKey(formKey: string, userId: string): string {
  return `${DRAFT_PREFIX}${formKey}:${userId}`;
}

/**
 * Persists a form's draft state to `localStorage`, scoped to the signed-in
 * user, so an in-progress submission survives not just a page refresh but a
 * full browser closure `sessionStorage` only covers the former.
 *
 * Namespaced per user (`omniplex:draft:{formKey}:{userId}`), unlike the
 * legacy site's single global `localStorage['value']` key, which leaked one
 * user's draft into the next person's session on a shared browser/profile.
 *
 * @param formKey - Identifies which form this is, e.g. `"bots/add"`. Combined
 *   with `userId` to form the storage key.
 * @param userId - The signed-in user's ID. Persistence is a no-op (acts like
 *   plain `useState`) until this is defined, so callers don't need to gate
 *   rendering on auth resolving first.
 * @param initialValue - Used only if no draft is found in storage, or before
 *   `userId` resolves.
 * @returns `[value, setValue, clearDraft]`, matching `useState`'s tuple shape
 *   plus a `clearDraft` function to call after a successful submit (drafts
 *   are otherwise kept indefinitely).
 */
export function usePersistedFormDraft<T>(
  formKey: string,
  userId: string | undefined,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>, () => void] {
  const [value, setValue] = useState<T>(initialValue);
  const hydrated = useRef(false);

  useEffect(() => {
    if (!userId || hydrated.current) return;
    hydrated.current = true;
    try {
      const raw = localStorage.getItem(draftKey(formKey, userId));
      if (raw) setValue(JSON.parse(raw));
    } catch {
      localStorage.removeItem(draftKey(formKey, userId));
    }
  }, [userId, formKey]);

  useEffect(() => {
    if (!userId || !hydrated.current) return;
    localStorage.setItem(draftKey(formKey, userId), JSON.stringify(value));
  }, [value, userId, formKey]);

  function clearDraft() {
    if (userId) localStorage.removeItem(draftKey(formKey, userId));
  }

  return [value, setValue, clearDraft];
}
