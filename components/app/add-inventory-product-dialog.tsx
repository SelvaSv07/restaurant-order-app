"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { addInventoryItem } from "@/app/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddInventoryProductDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border-0 bg-[#ff6b1e] px-4 text-xs font-semibold text-white shadow-none outline-none transition hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
      >
        <Plus className="size-3.5 shrink-0" aria-hidden />
        Add Product
      </DialogTrigger>
      <DialogContent className="max-w-md gap-6" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-[#333]">Add product</DialogTitle>
        </DialogHeader>
        <form
          action={async (fd) => {
            await addInventoryItem(fd);
            setOpen(false);
          }}
          className="grid gap-4"
        >
          <div className="grid gap-1.5">
            <Label htmlFor="inv-name">Name</Label>
            <Input id="inv-name" name="name" required placeholder="Item name" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="inv-unit">Unit</Label>
            <Input id="inv-unit" name="unit" required placeholder="kg / g / ml / piece" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="inv-qty">Quantity</Label>
              <Input id="inv-qty" name="quantity" type="number" min={0} defaultValue={0} />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="inv-max">Max stock</Label>
              <Input id="inv-max" name="maxStock" type="number" min={0} placeholder="Optional" />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="inv-low">Low stock</Label>
            <Input
              id="inv-low"
              name="reorderQty"
              type="number"
              min={0}
              defaultValue={0}
              placeholder="Alert when at or below"
            />
            <p className="text-xs text-[#858585]">Status shows Low when quantity is at or below this number.</p>
          </div>
          <Button
            type="submit"
            className="mt-2 w-full border-0 bg-[#ff6b1e] font-semibold shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
          >
            Save product
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
