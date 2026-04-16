"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { InferSelectModel } from "drizzle-orm";

import { updateInventoryItem } from "@/app/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inventoryItems } from "@/lib/db/schema";

type Row = InferSelectModel<typeof inventoryItems>;

export function EditInventoryItemDialog({ item }: { item: Row }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex h-9 shrink-0 cursor-pointer items-center rounded-[10px] border border-[#ebebeb] bg-white px-3.5 text-xs font-semibold text-[#333] shadow-sm transition hover:bg-[#f7f7f7]"
      >
        <Pencil className="mr-1.5 size-3.5" aria-hidden />
        Edit
      </DialogTrigger>
      <DialogContent className="max-w-md gap-6" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-[#333]">Edit inventory item</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await updateInventoryItem(fd);
            toast.success("Item updated");
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="category" value={item.category} />
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-inv-name-${item.id}`}>Name</Label>
            <Input id={`edit-inv-name-${item.id}`} name="name" required defaultValue={item.name} />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-inv-unit-${item.id}`}>Unit</Label>
            <Input id={`edit-inv-unit-${item.id}`} name="unit" required defaultValue={item.unit} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor={`edit-inv-qty-${item.id}`}>Quantity</Label>
              <Input
                id={`edit-inv-qty-${item.id}`}
                name="quantity"
                type="number"
                min={0}
                defaultValue={item.quantity}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`edit-inv-max-${item.id}`}>Max stock</Label>
              <Input
                id={`edit-inv-max-${item.id}`}
                name="maxStock"
                type="number"
                min={0}
                placeholder="Optional"
                defaultValue={item.maxStock ?? ""}
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-inv-low-${item.id}`}>Low stock</Label>
            <Input
              id={`edit-inv-low-${item.id}`}
              name="reorderQty"
              type="number"
              min={0}
              defaultValue={item.reorderQty}
            />
            <p className="text-xs text-[#858585]">Status shows Low when quantity is at or below this number.</p>
          </div>
          <Button type="submit" className="mt-2 w-full bg-[#ff6b1e] hover:bg-[#ff6b1e]/90">
            Save changes
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
