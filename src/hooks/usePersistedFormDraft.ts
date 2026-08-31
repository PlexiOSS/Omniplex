"use client";

// Copyright (C) 2026 NodeByte LTD 

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

const DRAFT_PREFIX = "omniplex:draft:";

function draftKey(formKey: string, userId: string): string {
  return `${DRAFT_PREFIX}${formKey}:${userId}`;
}

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
