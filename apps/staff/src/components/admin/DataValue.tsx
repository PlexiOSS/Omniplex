export function fieldLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\bid\b/gi, "ID")
    .replace(/\burl\b/gi, "URL")
    .replace(/^\w/, (c) => c.toUpperCase());
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function DataValue({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-zinc-400 dark:text-zinc-500">None</span>;
  }
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (typeof value !== "object") return <>{String(value)}</>;

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <span className="text-zinc-400 dark:text-zinc-500">None</span>;
    }
    if (value.every((v) => !isPlainObject(v) && !Array.isArray(v))) {
      return (
        <span className="flex flex-wrap gap-1">
          {value.map((v, i) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: values can repeat and have no ID
              key={i}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800"
            >
              {String(v)}
            </span>
          ))}
        </span>
      );
    }
    return (
      <span className="block space-y-2">
        {value.map((v, i) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: values can repeat and have no ID
            key={i}
            className="block rounded-lg border border-zinc-200 p-2 dark:border-zinc-800"
          >
            <DataValue value={v} />
          </span>
        ))}
      </span>
    );
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) {
    return <span className="text-zinc-400 dark:text-zinc-500">None</span>;
  }
  return (
    <dl className="grid gap-x-4 gap-y-1 border-l-2 border-zinc-200 pl-3 sm:grid-cols-[8rem_minmax(0,1fr)] dark:border-zinc-800">
      {entries.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-xs text-zinc-500 dark:text-zinc-400">
            {fieldLabel(k)}
          </dt>
          <dd className="min-w-0 wrap-anywhere">
            <DataValue value={v} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
