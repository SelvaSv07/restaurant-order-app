"use client";

import { useState } from "react";
import { toast } from "sonner";

import { setInventoryQuantity } from "@/app/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function UpdateInventoryStockDialog({
  id,
  name,
  unit,
  quantity,
}: {
  id: number;
  name: string;
  unit: string;
  quantity: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex items-center justify-center rounded-lg bg-[#ffeee0] px-2.5 py-1.5 text-[10px] font-medium text-[#333] outline-none hover:bg-[#ffeee0]/80"
      >
        Update Stock
      </DialogTrigger>
      <DialogContent className="max-w-sm gap-4" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-[#333]">Update stock</DialogTitle>
          <p className="text-sm text-[#858585]">
            {name} <span className="text-[#333]">({unit})</span>
          </p>
        </DialogHeader>
        <form
          action={async (fd) => {
            await setInventoryQuantity(fd);
            toast.success("Stock updated");
            setOpen(false);
          }}
          className="grid gap-3"
        >
          <input type="hidden" name="id" value={id} />
          <div className="grid gap-1.5">
            <Label htmlFor={`qty-${id}`}>Quantity</Label>
            <Input id={`qty-${id}`} name="quantity" type="number" min={0} defaultValue={quantity} required />
          </div>
          <Button type="submit" className="w-full bg-[#ff6b1e] hover:bg-[#ff6b1e]/90">
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
