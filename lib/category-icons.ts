import type { LucideIcon } from "lucide-react";
import {
  Apple,
  Beef,
  Beer,
  Cake,
  Candy,
  Cherry,
  Coffee,
  CookingPot,
  Croissant,
  CupSoda,
  Egg,
  Fish,
  Flame,
  GlassWater,
  IceCream,
  LayoutGrid,
  Leaf,
  Milk,
  Package,
  Pizza,
  Popcorn,
  Salad,
  Sandwich,
  Soup,
  Utensils,
  Wheat,
  Wine,
} from "lucide-react";

export const CATEGORY_ICON_MAP = {
  LayoutGrid,
  Utensils,
  Coffee,
  Pizza,
  CookingPot,
  Soup,
  Salad,
  Sandwich,
  IceCream,
  Beer,
  Wine,
  GlassWater,
  CupSoda,
  Apple,
  Beef,
  Croissant,
  Cake,
  Candy,
  Cherry,
  Egg,
  Milk,
  Package,
  Flame,
  Leaf,
  Fish,
  Popcorn,
  Wheat,
} as const satisfies Record<string, LucideIcon>;

export type CategoryIconKey = keyof typeof CATEGORY_ICON_MAP;

export const CATEGORY_ICON_KEYS = Object.keys(CATEGORY_ICON_MAP).sort() as CategoryIconKey[];

export function getCategoryIcon(name: string): LucideIcon {
  const Icon = CATEGORY_ICON_MAP[name as CategoryIconKey];
  return Icon ?? CATEGORY_ICON_MAP.Utensils;
}
