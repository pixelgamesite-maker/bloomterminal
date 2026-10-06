import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with grouped thousands and fixed decimals, monospace-friendly. */
export function fmt(n: number, decimals = 2): string {
  return n.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Signed percentage, e.g. +4.21% / -1.83%. */
export function pct(n: number): string {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(2)}%`;
}

/** Compact duration from ms, e.g. "3D 14H 21M". */
export function duration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d}D`);
  parts.push(`${h}H`);
  parts.push(`${m}M`);
  return parts.join(" ");
}
