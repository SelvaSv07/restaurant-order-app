"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteCategoryAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteCategoryDialog({
  categoryId,
  categoryName,
  productCount,
}: {
  categoryId: number;
  categoryName: string;
  productCount: number;
}) {
  const [open, setOpen] = useState(false);
  const canDelete = productCount === 0;

  if (!canDelete) {
    return (
      <Button
        type="button"
        variant="destructive"
        size="sm"
        disabled
        className="cursor-not-allowed opacity-60"
        title={`${productCount} product${productCount === 1 ? "" : "s"} use this category. Remove or move them first.`}
      >
        Delete
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[10px] border border-red-200/80 bg-red-50/90 px-3.5 text-xs font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
      >
        Delete
      </DialogTrigger>
      <DialogContent
        className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-md"
        showCloseButton
      >
        <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
          <DialogHeader className="gap-1">
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#333]">Delete category?</DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-[#858585]">
              This will remove <span className="font-medium text-[#333]">{categoryName}</span>. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-[#ebebeb] bg-[#fafafa] px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-9 rounded-[10px] border-[#ebebeb] bg-white font-semibold text-[#333] hover:bg-[#f7f7f7]"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <form
            action={async (fd) => {
              const result = await deleteCategoryAction(fd);
              if (!result.ok) {
                toast.error(result.error ?? "Could not delete category");
                return;
              }
              setOpen(false);
            }}
            className="inline sm:shrink-0"
          >
            <input type="hidden" name="id" value={categoryId} />
            <Button
              type="submit"
              variant="destructive"
              className="h-9 w-full rounded-[10px] border-0 bg-red-600 font-semibold text-white hover:bg-red-700 sm:w-auto"
            >
              Delete category
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
