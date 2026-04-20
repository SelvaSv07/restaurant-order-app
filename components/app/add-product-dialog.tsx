"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { createProductAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductPhotoFileField } from "@/components/app/product-photo-file-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const fieldClass =
  "h-10 rounded-xl border-0 bg-[#f7f7f7] shadow-none ring-1 ring-[#ebebeb] transition-colors focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 md:text-sm";
const labelClass = "cursor-pointer text-xs font-medium text-[#858585]";
const selectTriggerClass = cn(
  fieldClass,
  "w-full cursor-pointer justify-between px-3 text-left text-sm font-normal text-[#333] hover:bg-[#f0f0f0] data-[placeholder]:text-[#a3a3a3]",
);

export function AddProductDialog({
  categories,
}: {
  categories: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);
  const [categoryId, setCategoryId] = useState(String(categories[0]?.id ?? ""));
  const canAdd = categories.length > 0;
  const onPhotoValidation = useCallback((ok: boolean) => {
    setPhotoOk(ok);
  }, []);

  const firstCategoryId = categories[0]?.id;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPhotoOk(true);
          if (firstCategoryId != null) setCategoryId(String(firstCategoryId));
        }
      }}
    >
      <DialogTrigger
        type="button"
        disabled={!canAdd}
        className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#ff6b1e] px-4 text-xs font-semibold text-white shadow-none outline-none transition hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 disabled:pointer-events-none disabled:opacity-50"
      >
        <Plus className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
        Add product
      </DialogTrigger>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-[440px]"
        showCloseButton
      >
        <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#333]">Add product</DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-[#858585]">
              Add a new item to your menu with price and optional photo.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          action={async (fd) => {
            await createProductAction(fd);
            setOpen(false);
          }}
          className="grid gap-4 px-5 pb-5 pt-4 sm:grid-cols-2"
        >
          <input type="hidden" name="categoryId" value={categoryId} />
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor="prod-name" className={labelClass}>
              Name
            </Label>
            <Input
              id="prod-name"
              name="name"
              required
              placeholder="Product name"
              className={cn(fieldClass, "cursor-text text-[#333] placeholder:text-[#a3a3a3]")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prod-category-trigger" className={labelClass}>
              Category
            </Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger id="prod-category-trigger" className={selectTriggerClass} size="default">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent align="start">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={String(category.id)}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="prod-price" className={labelClass}>
              Price (₹)
            </Label>
            <Input
              id="prod-price"
              name="priceRupee"
              type="number"
              min={0}
              required
              placeholder="0"
              className={cn(fieldClass, "cursor-text text-[#333]")}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 py-0.5 text-sm font-medium text-[#333] sm:col-span-2">
            <input
              type="checkbox"
              name="includeInKot"
              className="size-4 shrink-0 cursor-pointer rounded border-[#dcdcdc] accent-[#ff6b1e]"
            />
            Include in KOT
          </label>
          <ProductPhotoFileField
            key={String(open)}
            id="prod-image"
            label="Photo (optional)"
            labelClassName={labelClass}
            onValidationChange={onPhotoValidation}
          />
          <Button
            type="submit"
            disabled={!photoOk}
            className="mt-1 h-10 w-full border-0 bg-[#ff6b1e] text-sm font-semibold text-white shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 disabled:opacity-50 sm:col-span-2"
          >
            Save product
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
