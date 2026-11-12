"use client";

import { Download } from "lucide-react";
import { type ReactNode, useRef } from "react";

const BRAND_ACCENT = "#6366f1";
const PNG_SIZE = 1024;

interface BrandAssetProps {
  name: string;
  label: string;
  ink?: string;
  background?: string;
  width?: number;
  height?: number;
  bleed?: boolean;
  className?: string;
  children: ReactNode;
}

function serialize(
  svg: SVGSVGElement,
  ink: string,
  width: number,
  height: number,
): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.removeAttribute("class");
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  const xml = new XMLSerializer().serializeToString(clone);
  return xml
    .replaceAll("var(--accent)", BRAND_ACCENT)
    .replaceAll("currentColor", ink)
    .replaceAll('font-family="inherit"', 'font-family="Arial, sans-serif"');
}

function save(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function BrandAsset({
  name,
  label,
  ink = "#fafafa",
  background,
  width = PNG_SIZE,
  height = PNG_SIZE,
  bleed = false,
  className = "",
  children,
}: BrandAssetProps) {
  const ref = useRef<HTMLDivElement>(null);

  function svgText() {
    const svg = ref.current?.querySelector("svg");
    return svg ? serialize(svg, ink, width, height) : null;
  }

  function downloadSvg() {
    const text = svgText();
    if (text) save(new Blob([text], { type: "image/svg+xml" }), `${name}.svg`);
  }

  function downloadPng() {
    const text = svgText();
    if (!text) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      if (background) {
        ctx.fillStyle = background;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => blob && save(blob, `${name}.png`), "image/png");
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
  }

  const button =
    "inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 text-xs font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300";

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div
        ref={ref}
        className={`flex items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 ${bleed ? "" : "p-6"}`}
        style={{
          background: background ?? undefined,
          aspectRatio: `${width} / ${height}`,
        }}
      >
        {children}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {label}
        </p>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" onClick={downloadSvg} className={button}>
            <Download size={12} />
            SVG
          </button>
          <button type="button" onClick={downloadPng} className={button}>
            <Download size={12} />
            PNG
          </button>
        </div>
      </div>
    </div>
  );
}
