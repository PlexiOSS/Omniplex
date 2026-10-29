// Copyright (C) 2026 NodeByte LTD 

const SUPER_PERMS = ["owner", "administrator"];

export function isSuperPerm(id: string): boolean {
  return SUPER_PERMS.includes(id);
}

export function hasPermString(perms: string[], target: string): boolean {
  return perms.some((p) => SUPER_PERMS.includes(p)) || perms.includes(target);
}

export function hasAllPermStrings(perms: string[], required: string[]): boolean {
  return required.every((r) => hasPermString(perms, r));
}

export function hasAnyPermString(perms: string[], required: string[]): boolean {
  return required.some((r) => hasPermString(perms, r));
}
