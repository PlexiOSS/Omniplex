const HEX6_PATTERN = /^#[0-9a-fA-F]{6}$/;

interface ColorInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/** A native color-swatch picker paired with a plain hex text input, since
 * some people want to pick a color visually and some want to paste a hex
 * code they already have. */
export function ColorInput({
  id,
  label,
  value,
  onChange,
  required,
}: ColorInputProps) {
  const valid = value === "" || HEX6_PATTERN.test(value);
  const swatchValue = HEX6_PATTERN.test(value) ? value : "#000000";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={`${label} swatch`}
          value={swatchValue}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-950"
        />
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#5865F2"
          maxLength={7}
          required={required}
          className={[
            "h-10 w-full min-w-0 rounded-xl border bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-400",
            "transition-colors outline-none",
            valid
              ? "border-zinc-200 focus:border-zinc-400 dark:border-zinc-800 dark:focus:border-zinc-600"
              : "border-red-500 dark:border-red-500",
            "dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600",
          ].join(" ")}
        />
      </div>
      {!valid && (
        <p className="text-xs text-red-600 dark:text-red-400">
          Must be a 6-digit hex code, e.g. #5865F2
        </p>
      )}
    </div>
  );
}
