"use client";

import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { createCategoryAction } from "@/app/(app)/settings/actions";
import { CategoryColorPicker } from "@/components/app/category-color-picker";
import { CategoryIconPicker } from "@/components/app/category-icon-picker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_PALETTE_COLORS,
  firstAvailablePaletteColor,
  normalizeColorHex,
  type CategoryPaletteColor,
} from "@/lib/category-colors";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 rounded-xl border-0 bg-[#f7f7f7] shadow-none ring-1 ring-[#ebebeb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 md:text-sm";
const labelClass = "cursor-pointer text-xs font-medium text-[#858585]";

export function AddCategoryDialog({ takenColorHexes }: { takenColorHexes: string[] }) {
  const [open, setOpen] = useState(false);
  const [iconKey, setIconKey] = useState("Utensils");
  const [colorHex, setColorHex] = useState<CategoryPaletteColor>(CATEGORY_PALETTE_COLORS[0]);

  const takenKey = useMemo(() => takenColorHexes.slice().sort().join("|"), [takenColorHexes]);
  const takenSet = useMemo(
    () => new Set(takenColorHexes.map((h) => normalizeColorHex(h)).filter(Boolean)),
    [takenKey],
  );

  const noFreeColor = useMemo(() => firstAvailablePaletteColor(takenSet) === null, [takenSet]);

  useEffect(() => {
    if (!open) return;
    setIconKey("Utensils");
    const next = firstAvailablePaletteColor(takenSet);
    if (next) setColorHex(next);
    else setColorHex(CATEGORY_PALETTE_COLORS[0]);
  }, [open, takenSet]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-[10px] border-0 bg-[#ff6b1e] px-4 text-xs font-semibold text-white shadow-none outline-none hover:bg-[#ff6b1e]/90"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        Add category
      </DialogTrigger>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-[400px]"
        showCloseButton
      >
        <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#333]">Add category</DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-[#858585]">
              Name your category and pick an icon and color for the menu.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          action={async (fd) => {
            const result = await createCategoryAction(fd);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setOpen(false);
          }}
          className="grid gap-4 px-5 pb-5 pt-4"
        >
          <input type="hidden" name="iconKey" value={iconKey} />
          <div className="grid gap-2">
            <Label htmlFor="cat-name" className={labelClass}>
              Name
            </Label>
            <Input
              id="cat-name"
              name="name"
              required
              placeholder="Category name"
              className={cn(fieldClass, "cursor-text text-[#333] placeholder:text-[#a3a3a3]")}
            />
          </div>
          <div className="grid gap-2">
            <span className={labelClass}>Icon</span>
            <CategoryIconPicker id="cat-add-icon" value={iconKey} onChange={setIconKey} accentColor={colorHex} />
          </div>
          <div className="grid gap-2">
            <span className={labelClass}>Color</span>
            {noFreeColor && (
              <p className="text-xs leading-snug text-amber-800">
                All palette colors are already assigned to categories. Remove or recolor a category before adding a new
                one.
              </p>
            )}
            <CategoryColorPicker
              name="colorHex"
              value={colorHex}
              onChange={setColorHex}
              takenByOtherCategories={takenSet}
            />
          </div>
          <Button
            type="submit"
            disabled={noFreeColor}
            className="mt-1 h-10 w-full rounded-[10px] border-0 bg-[#ff6b1e] text-sm font-semibold text-white shadow-none hover:bg-[#ff6b1e]/90 disabled:opacity-50"
          >
            Save category
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
