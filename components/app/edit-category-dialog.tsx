"use client";

import { Pencil } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { updateCategoryAction } from "@/app/(app)/settings/actions";
import { CategoryColorPicker } from "@/components/app/category-color-picker";
import { Button } from "@/components/ui/button";
import { CategoryIconPicker } from "@/components/app/category-icon-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORY_PALETTE_COLORS,
  firstAvailablePaletteColor,
  isPaletteColor,
  normalizeColorHex,
  type CategoryPaletteColor,
} from "@/lib/category-colors";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 rounded-xl border-0 bg-[#f7f7f7] shadow-none ring-1 ring-[#ebebeb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 md:text-sm";
const labelClass = "cursor-pointer text-xs font-medium text-[#858585]";

export type EditCategoryDialogCategory = {
  id: number;
  name: string;
  iconKey: string;
  colorHex: string;
};

function EditCategoryForm({
  category,
  takenByOthers,
  onSaved,
}: {
  category: EditCategoryDialogCategory;
  takenByOthers: Set<string>;
  onSaved: () => void;
}) {
  const [iconKey, setIconKey] = useState(category.iconKey);
  const [colorHex, setColorHex] = useState<CategoryPaletteColor>(() => {
    if (isPaletteColor(category.colorHex)) return normalizeColorHex(category.colorHex) as CategoryPaletteColor;
    const next = firstAvailablePaletteColor(takenByOthers);
    return next ?? CATEGORY_PALETTE_COLORS[0];
  });

  const legacyColor = !isPaletteColor(category.colorHex);

  return (
    <form
      action={async (fd) => {
        const result = await updateCategoryAction(fd);
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        onSaved();
      }}
      className="grid gap-4 px-5 pb-5 pt-4"
    >
      <input type="hidden" name="categoryId" value={category.id} />
      <input type="hidden" name="iconKey" value={iconKey} />
      <div className="grid gap-2">
        <Label htmlFor={`cat-edit-name-${category.id}`} className={labelClass}>
          Name
        </Label>
        <Input
          id={`cat-edit-name-${category.id}`}
          name="name"
          required
          defaultValue={category.name}
          placeholder="Category name"
          className={cn(fieldClass, "cursor-text text-[#333] placeholder:text-[#a3a3a3]")}
        />
      </div>
      <div className="grid gap-2">
        <span className={labelClass}>Icon</span>
        <CategoryIconPicker
          id={`cat-edit-icon-${category.id}`}
          value={iconKey}
          onChange={setIconKey}
          accentColor={colorHex}
        />
      </div>
      <div className="grid gap-2">
        <span className={labelClass}>Color</span>
        {legacyColor && (
          <p className="text-xs leading-snug text-amber-800">
            This category&apos;s saved color isn&apos;t in the current palette. Choose one of the colors below.
          </p>
        )}
        <CategoryColorPicker
          name="colorHex"
          value={colorHex}
          onChange={setColorHex}
          takenByOtherCategories={takenByOthers}
        />
      </div>
      <Button
        type="submit"
        className="mt-1 h-10 w-full border-0 bg-[#ff6b1e] text-sm font-semibold text-white shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
      >
        Save changes
      </Button>
    </form>
  );
}

export function EditCategoryDialog({
  category,
  otherCategoriesColorHexes,
}: {
  category: EditCategoryDialogCategory;
  otherCategoriesColorHexes: string[];
}) {
  const [open, setOpen] = useState(false);

  const takenByOthers = useMemo(
    () => new Set(otherCategoriesColorHexes.map((h) => normalizeColorHex(h)).filter(Boolean)),
    [otherCategoriesColorHexes],
  );

  const formKey = `${open}-${category.id}-${category.iconKey}-${category.colorHex}-${category.name}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-white px-3 text-xs font-semibold text-[#333] shadow-none transition hover:bg-[#f7f7f7] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
      >
        <Pencil className="size-3.5 shrink-0 text-[#858585]" strokeWidth={2} aria-hidden />
        Edit
      </DialogTrigger>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-[400px]"
        showCloseButton
      >
        <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#333]">Edit category</DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-[#858585]">
              Update the name, icon, and color for this category.
            </DialogDescription>
          </DialogHeader>
        </div>
        <EditCategoryForm
          key={formKey}
          category={category}
          takenByOthers={takenByOthers}
          onSaved={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
