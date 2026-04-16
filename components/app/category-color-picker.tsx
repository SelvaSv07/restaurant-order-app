"use client";

import { Check } from "lucide-react";

import {
  CATEGORY_PALETTE_COLORS,
  normalizeColorHex,
  type CategoryPaletteColor,
} from "@/lib/category-colors";
import { cn } from "@/lib/utils";

function isLightSwatch(hex: string): boolean {
  const n = normalizeColorHex(hex);
  if (!n) return false;
  const r = Number.parseInt(n.slice(1, 3), 16);
  const g = Number.parseInt(n.slice(3, 5), 16);
  const b = Number.parseInt(n.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.62;
}

export function CategoryColorPicker({
  id,
  name,
  value,
  onChange,
  /** Normalized hex colors already used by other categories (current category's color must not be listed here). */
  takenByOtherCategories,
}: {
  id?: string;
  name: string;
  value: string;
  onChange: (hex: CategoryPaletteColor) => void;
  takenByOtherCategories: Set<string>;
}) {
  const current = normalizeColorHex(value);

  return (
    <div id={id} className="grid grid-cols-5 gap-2">
      {CATEGORY_PALETTE_COLORS.map((hex) => {
        const taken = takenByOtherCategories.has(hex);
        const selected = current === hex;
        const disabled = taken && !selected;
        return (
          <button
            key={hex}
            type="button"
            disabled={disabled}
            title={disabled ? "Already used by another category" : undefined}
            onClick={() => onChange(hex)}
            className={cn(
              "relative flex size-10 items-center justify-center rounded-full ring-2 ring-offset-2 ring-offset-white transition",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/50",
              disabled
                ? "cursor-not-allowed opacity-35 ring-transparent"
                : "cursor-pointer hover:scale-105 hover:ring-[#ebebeb]",
              selected ? "ring-[#ff6b1e]" : "ring-transparent",
            )}
            style={{ backgroundColor: hex }}
            aria-label={disabled ? `Color ${hex} unavailable` : `Color ${hex}`}
            aria-pressed={selected}
          >
            {selected && !disabled && (
              <Check
                className={cn(
                  "size-5 drop-shadow-sm",
                  isLightSwatch(hex) ? "text-[#333]" : "text-white",
                )}
                strokeWidth={2.5}
                aria-hidden
              />
            )}
          </button>
        );
      })}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
