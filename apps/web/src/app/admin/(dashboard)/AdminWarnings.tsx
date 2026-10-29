"use client";

import { useAdmin } from "../AdminContext";

export function AdminWarnings() {
  const { warnings } = useAdmin();
  if (warnings.length === 0) return null;

  return (
    <div className="border-b border-yellow-200 bg-yellow-50 px-4 py-2 dark:border-yellow-900 dark:bg-yellow-950/30">
      <div className="space-y-1">
        {warnings.map((w) => (
          <p key={w} className="text-xs text-yellow-800 dark:text-yellow-400">
            {w}
          </p>
        ))}
      </div>
    </div>
  );
}
