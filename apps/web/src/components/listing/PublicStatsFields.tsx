import { Toggle } from "@/app/dashboard/manage/ManageShell";

export function PublicStatsFields({
  options,
  hidden,
  onChange,
}: {
  options: { value: string; label: string }[];
  hidden: string[];
  onChange: (hidden: string[]) => void;
}) {
  return (
    <div className="space-y-3 border-t border-zinc-100 pt-5 dark:border-zinc-800">
      <div>
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Public stats
        </p>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Turn a stat off to hide it from your page, cards, widgets, link
          previews and the public API. You and your team still see it here.
          Votes always show, because lists are ranked by them.
        </p>
      </div>
      {options.map((option) => (
        <Toggle
          key={option.value}
          checked={!hidden.includes(option.value)}
          onChange={(show) =>
            onChange(
              show
                ? hidden.filter((s) => s !== option.value)
                : [...hidden, option.value],
            )
          }
          label={option.label}
        />
      ))}
    </div>
  );
}
