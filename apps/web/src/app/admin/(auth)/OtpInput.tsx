"use client";

import { useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
  length = 6,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  function set(next: string) {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
    return clean;
  }

  function handleInput(i: number, raw: string) {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    const chars = value.split("");
    for (let k = 0; k < typed.length && i + k < length; k++) {
      chars[i + k] = typed[k];
    }
    const clean = set(chars.join(""));
    refs.current[Math.min(clean.length, length - 1)]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        set(value.slice(0, i) + value.slice(i + 1));
      } else if (i > 0) {
        set(value.slice(0, i - 1) + value.slice(i));
        refs.current[i - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
  }

  return (
    <fieldset className="flex justify-center gap-2 sm:gap-2.5">
      <legend className="sr-only">Authentication code</legend>
      {digits.map((d, i) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length digit slots
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          disabled={disabled}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => {
            e.preventDefault();
            const clean = set(e.clipboardData.getData("text"));
            refs.current[Math.min(clean.length, length - 1)]?.focus();
          }}
          onFocus={(e) => e.target.select()}
          className="h-12 w-10 rounded-xl border border-zinc-200 bg-white text-center font-mono text-lg font-semibold text-zinc-950 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:opacity-50 sm:h-14 sm:w-12 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        />
      ))}
    </fieldset>
  );
}
