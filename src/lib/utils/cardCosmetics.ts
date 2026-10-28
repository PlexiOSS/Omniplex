import type { CSSProperties } from "react";

const HEX6 = /^#[0-9a-fA-F]{6}$/;

export function cardCosmetics(entity: {
  highlighted?: boolean;
  card_color?: string;
}): { className: string; style: CSSProperties | undefined } {
  const color =
    entity.card_color && HEX6.test(entity.card_color)
      ? entity.card_color
      : null;
  const style: CSSProperties = {};

  if (color) {
    style.borderColor = `${color}66`;
    style.backgroundImage = `linear-gradient(135deg, ${color}26, transparent 60%)`;
  }

  if (entity.highlighted) {
    if (color) {
      style.boxShadow = `0 0 0 2px ${color}80, 0 10px 28px -10px ${color}aa`;
      return { className: "", style };
    }
    return {
      className: "ring-2 ring-accent/50 shadow-lg shadow-accent/20",
      style: undefined,
    };
  }

  return { className: "", style: color ? style : undefined };
}

export function headerTint(cardColor?: string): {
  className: string;
  style: CSSProperties | undefined;
} {
  if (!cardColor || !HEX6.test(cardColor)) {
    return { className: "", style: undefined };
  }
  return {
    className: "rounded-2xl border p-4 sm:p-5",
    style: {
      borderColor: `${cardColor}55`,
      backgroundImage: `linear-gradient(135deg, ${cardColor}2e, ${cardColor}0d 45%, transparent 75%)`,
    },
  };
}
