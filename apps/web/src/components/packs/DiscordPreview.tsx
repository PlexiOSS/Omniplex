interface DiscordPreviewProps {
  kind: "emoji" | "sticker";
  src: string;
  name: string;
}

const THEMES = [
  {
    label: "Dark",
    bg: "#313338",
    text: "#dbdee1",
    name: "#f2f3f5",
    muted: "#949ba4",
  },
  {
    label: "Light",
    bg: "#ffffff",
    text: "#313338",
    name: "#060607",
    muted: "#5c5e66",
  },
];

export function DiscordPreview({ kind, src, name }: DiscordPreviewProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        How it looks in Discord
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {THEMES.map((t) => (
          <div
            key={t.label}
            className="overflow-hidden rounded-xl ring-1 ring-zinc-200 dark:ring-zinc-800"
            style={{ backgroundColor: t.bg }}
          >
            <div className="flex gap-3 p-4">
              <div className="h-10 w-10 shrink-0 rounded-full bg-[#5865F2]" />
              <div className="min-w-0 text-[15px] leading-snug">
                <p>
                  <span className="font-medium" style={{ color: t.name }}>
                    you
                  </span>{" "}
                  <span className="text-xs" style={{ color: t.muted }}>
                    Today at 12:00
                  </span>
                </p>
                {kind === "emoji" ? (
                  <>
                    <p className="mt-0.5" style={{ color: t.text }}>
                      this is great{" "}
                      {/* biome-ignore lint/performance/noImgElement: emoji shown at Discord's inline size */}
                      <img
                        src={src}
                        alt={`:${name}:`}
                        width={22}
                        height={22}
                        className="inline-block align-[-0.3em]"
                      />
                    </p>
                    <p className="mt-1">
                      {/* biome-ignore lint/performance/noImgElement: emoji shown at Discord's jumbo size */}
                      <img src={src} alt={`:${name}:`} width={48} height={48} />
                    </p>
                  </>
                ) : (
                  <p className="mt-1">
                    {/* biome-ignore lint/performance/noImgElement: sticker shown at Discord's size */}
                    <img src={src} alt={name} width={160} height={160} />
                  </p>
                )}
              </div>
            </div>
            <p
              className="border-t px-4 py-1.5 text-[11px]"
              style={{
                color: t.muted,
                borderColor: t.label === "Dark" ? "#3f4147" : "#e3e5e8",
              }}
            >
              {t.label} theme
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
