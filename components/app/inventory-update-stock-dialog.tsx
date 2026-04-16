"use client";

import { Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { setInventoryQuantity } from "@/app/(app)/inventory/actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function InventoryUpdateStockDialog({
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
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(quantity);

  useEffect(() => {
    if (open) setValue(quantity);
  }, [open, quantity, id]);

  function save() {
    const q = Math.max(0, value);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", String(id));
      fd.set("quantity", String(q));
      await setInventoryQuantity(fd);
      toast.success("Stock updated");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        type="button"
        className="inline-flex items-center justify-center rounded-lg bg-[#ffeee0] px-3 py-1.5 text-xs font-medium text-[#333] outline-none hover:bg-[#ffeee0]/80"
      >
        Update
      </DialogTrigger>
      <DialogContent className="max-w-md gap-5" showCloseButton>
        <DialogHeader className="gap-3">
          <DialogTitle className="text-lg font-semibold text-[#333]">Update stock</DialogTitle>
          <p className="text-balance">
            <span className="text-2xl font-semibold tracking-tight text-[#333]">{name}</span>
            <span className="text-[#c4c4c4]"> · </span>
            <span className="text-xl font-medium text-[#858585]">{unit}</span>
          </p>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <Button
              type="button"
              variant="outline"
              className="size-12 shrink-0 rounded-xl border-[#ebebeb] bg-white p-0 shadow-none hover:bg-[#fafafa] disabled:opacity-40"
              disabled={pending || value <= 0}
              aria-label="Decrease quantity"
              onClick={() => setValue((v) => Math.max(0, v - 1))}
            >
              <Minus className="size-6 text-[#333]" strokeWidth={2.5} />
            </Button>
            <span className="min-w-[4.5ch] text-center text-4xl font-semibold tabular-nums tracking-tight text-[#333]">
              {value}
            </span>
            <Button
              type="button"
              variant="outline"
              className="size-12 shrink-0 rounded-xl border-[#ebebeb] bg-white p-0 shadow-none hover:bg-[#fafafa]"
              disabled={pending}
              aria-label="Increase quantity"
              onClick={() => setValue((v) => v + 1)}
            >
              <Plus className="size-6 text-[#333]" strokeWidth={2.5} />
            </Button>
          </div>
          <Button
            type="button"
            className="w-full bg-[#ff6b1e] hover:bg-[#ff6b1e]/90"
            disabled={pending}
            onClick={() => save()}
          >
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
