/** 20 predefined category accent colors (hex, lowercase). */
export const CATEGORY_PALETTE_COLORS = [
  "#f97316",
  "#ef4444",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#84cc16",
  "#06b6d4",
  "#6366f1",
  "#78716c",
  "#0d9488",
  "#c026d3",
  "#dc2626",
  "#15803d",
  "#1d4ed8",
  "#7c2d12",
  "#404040",
] as const;

export type CategoryPaletteColor = (typeof CATEGORY_PALETTE_COLORS)[number];

const PALETTE_SET = new Set<string>(CATEGORY_PALETTE_COLORS);

/** Normalize hex for comparison: #rrggbb lowercase. */
export function normalizeColorHex(hex: string): string {
  const t = hex.trim();
  if (!t) return "";
  const withHash = t.startsWith("#") ? t : `#${t}`;
  if (!/^#[0-9a-fA-F]{6}$/.test(withHash)) return "";
  return withHash.toLowerCase();
}

export function isPaletteColor(hex: string): hex is CategoryPaletteColor {
  const n = normalizeColorHex(hex);
  return n !== "" && PALETTE_SET.has(n);
}

/** First palette color not present in `used` (normalized hex set), or `null` if all 20 are taken. */
export function firstAvailablePaletteColor(used: Set<string>): CategoryPaletteColor | null {
  const usedNorm = new Set([...used].map((h) => normalizeColorHex(h)).filter(Boolean));
  for (const c of CATEGORY_PALETTE_COLORS) {
    if (!usedNorm.has(c)) return c;
  }
  return null;
}
