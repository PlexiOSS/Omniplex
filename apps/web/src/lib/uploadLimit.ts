const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 300;

const hits = new Map<string, number[]>();

export function allowUpload(userId: string, now = Date.now()): boolean {
  const cutoff = now - WINDOW_MS;
  const recent = (hits.get(userId) ?? []).filter((t) => t > cutoff);

  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(userId, recent);
    return false;
  }

  recent.push(now);
  hits.set(userId, recent);

  if (hits.size > 10_000) {
    for (const [id, times] of hits) {
      if (!times.some((t) => t > cutoff)) hits.delete(id);
    }
  }

  return true;
}

export function resetUploadLimits() {
  hits.clear();
}
