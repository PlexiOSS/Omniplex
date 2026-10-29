export function commandLabel(name: string): string {
  const trimmed = name.trim();
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}
