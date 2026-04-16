"use client";

import { useState } from "react";
import { toast } from "sonner";

import { deleteInventoryItem } from "@/app/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteInventoryItemDialog({ id, name }: { id: number; name: string }) {
  const [open, setOpen] = useState(false);

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
            <DialogTitle className="text-lg font-semibold tracking-tight text-[#333]">Delete item?</DialogTitle>
            <DialogDescription className="text-[13px] leading-snug text-[#858585]">
              This will remove <span className="font-medium text-[#333]">{name}</span> from inventory. This cannot be
              undone.
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
              await deleteInventoryItem(fd);
              toast.success("Item removed");
              setOpen(false);
            }}
            className="inline sm:shrink-0"
          >
            <input type="hidden" name="id" value={id} />
            <Button
              type="submit"
              variant="destructive"
              className="h-9 w-full rounded-[10px] border-0 bg-red-600 font-semibold text-white hover:bg-red-700 sm:w-auto"
            >
              Delete item
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
