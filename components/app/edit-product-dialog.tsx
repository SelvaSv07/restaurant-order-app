"use client";

import { Pencil } from "lucide-react";
import { useCallback, useState } from "react";

import { updateProductAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
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

export type EditProductDialogProduct = {
  id: number;
  name: string;
  categoryId: number;
  priceRupee: number;
  includeInKot: boolean;
  active: boolean;
  imageLocalPath: string | null;
};

export function EditProductDialog({
  product,
  categories,
}: {
  product: EditProductDialogProduct;
  categories: { id: number; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [photoOk, setPhotoOk] = useState(true);
  const [categoryId, setCategoryId] = useState(String(product.categoryId));
  const onPhotoValidation = useCallback((ok: boolean) => {
    setPhotoOk(ok);
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setPhotoOk(true);
          setCategoryId(String(product.categoryId));
        }
      }}
    >
      <DialogTrigger
        type="button"
        className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#ebebeb] bg-white px-3 text-xs font-semibold text-[#333] shadow-none transition hover:bg-[#f7f7f7] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
      >
        <Pencil className="size-3.5 shrink-0 text-[#858585]" strokeWidth={2} aria-hidden />
        Edit
      </DialogTrigger>
      <DialogContent
        key={product.id}
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-[440px]"
        showCloseButton
      >
        <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#333]">Edit product</DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-[#858585]">
              Update name, price, category, and visibility for this menu item.
            </DialogDescription>
          </DialogHeader>
        </div>
        <form
          action={async (fd) => {
            await updateProductAction(fd);
            setOpen(false);
          }}
          className="grid gap-4 px-5 pb-5 pt-4 sm:grid-cols-2"
        >
          <input type="hidden" name="productId" value={product.id} />
          <input type="hidden" name="categoryId" value={categoryId} />
          <div className="grid gap-2 sm:col-span-2">
            <Label htmlFor={`edit-name-${product.id}`} className={labelClass}>
              Name
            </Label>
            <Input
              id={`edit-name-${product.id}`}
              name="name"
              required
              placeholder="Product name"
              defaultValue={product.name}
              className={cn(fieldClass, "cursor-text text-[#333] placeholder:text-[#a3a3a3]")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-category-${product.id}`} className={labelClass}>
              Category
            </Label>
            <Select value={categoryId} onValueChange={(v) => v && setCategoryId(v)}>
              <SelectTrigger id={`edit-category-${product.id}`} className={selectTriggerClass} size="default">
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
            <Label htmlFor={`edit-price-${product.id}`} className={labelClass}>
              Price (₹)
            </Label>
            <Input
              id={`edit-price-${product.id}`}
              name="priceRupee"
              type="number"
              min={0}
              required
              defaultValue={product.priceRupee}
              className={cn(fieldClass, "cursor-text text-[#333]")}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-3 py-0.5 text-sm font-medium text-[#333] sm:col-span-2">
            <input
              type="checkbox"
              name="includeInKot"
              className="size-4 shrink-0 cursor-pointer rounded border-[#dcdcdc] accent-[#ff6b1e]"
              defaultChecked={product.includeInKot}
            />
            Include in KOT
          </label>
          <label className="flex cursor-pointer items-center gap-3 py-0.5 text-sm font-medium text-[#333] sm:col-span-2">
            <input
              type="checkbox"
              name="active"
              className="size-4 shrink-0 cursor-pointer rounded border-[#dcdcdc] accent-[#ff6b1e]"
              defaultChecked={product.active}
            />
            Active (shown on menu / billing)
          </label>
          <ProductPhotoFileField
            key={String(open)}
            id={`edit-image-${product.id}`}
            label="Photo — optional, leave empty to keep current"
            labelClassName={labelClass}
            existingImageSrc={product.imageLocalPath}
            onValidationChange={onPhotoValidation}
          />
          <Button
            type="submit"
            disabled={!photoOk}
            className="mt-1 h-10 w-full border-0 bg-[#ff6b1e] text-sm font-semibold text-white shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 disabled:opacity-50 sm:col-span-2"
          >
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
