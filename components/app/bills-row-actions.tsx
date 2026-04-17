"use client";

import { useState, useTransition } from "react";
import { Ban, EllipsisVertical } from "lucide-react";
import { toast } from "sonner";

import { deleteOrVoidBillAction } from "@/app/(app)/bills/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Status = "draft" | "completed" | "voided";

export function BillsRowActions({
  billId,
  status,
}: {
  billId: number;
  status: Status;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [reprintOpen, setReprintOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const showReprint = status !== "draft" && status !== "voided";
  const showCancel = status !== "voided";

  const runCancel = () => {
    startTransition(async () => {
      const result = await deleteOrVoidBillAction(billId);
      setCancelOpen(false);
      setPopoverOpen(false);
      if (!result.ok) {
        toast.error(result.error === "already_void" ? "Order is already canceled." : "Could not update order.");
        return;
      }
      toast.success("Order canceled.");
    });
  };

  const runReprint = () => {
    window.open(`/print/${billId}`, "_blank", "noopener,noreferrer");
    setReprintOpen(false);
    setPopoverOpen(false);
  };

  if (status === "voided") {
    return (
      <span className="text-xs text-[#858585]" aria-hidden>
        —
      </span>
    );
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          type="button"
          className={cn(
            "inline-flex size-8 cursor-pointer items-center justify-center rounded-lg border border-[#ebebeb] bg-white text-[#333] shadow-none",
            "hover:bg-[#f7f7f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35",
          )}
          aria-label="Order actions"
        >
          <EllipsisVertical className="size-4" aria-hidden />
        </PopoverTrigger>
        <PopoverContent align="end" className="w-48 p-2">
          <div className="flex flex-col gap-1">
            {showReprint ? (
              <button
                type="button"
                className={cn(
                  "inline-flex w-full cursor-pointer items-center rounded-md px-3 py-2 text-left text-sm font-medium text-[#333]",
                  "hover:bg-[#f7f7f7]",
                )}
                onClick={() => {
                  setPopoverOpen(false);
                  setReprintOpen(true);
                }}
              >
                Reprint
              </button>
            ) : null}
            {showCancel ? (
              <button
                type="button"
                className={cn(
                  "inline-flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-sm font-medium text-[#dc2626]",
                  "hover:bg-red-50",
                )}
                onClick={() => {
                  setPopoverOpen(false);
                  setCancelOpen(true);
                }}
              >
                <Ban className="size-4 shrink-0" strokeWidth={2} aria-hidden />
                Cancel
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      <Dialog open={reprintOpen} onOpenChange={setReprintOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reprint bill?</DialogTitle>
            <DialogDescription>
              A printable bill will open in a new tab. Use your browser’s print dialog to send it to a printer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" className="rounded-lg" onClick={() => setReprintOpen(false)}>
              Back
            </Button>
            <Button
              type="button"
              className="rounded-lg border-0 bg-[#ff6b1e] text-white hover:bg-[#ea580c]"
              onClick={runReprint}
            >
              Reprint
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent showCloseButton={false} className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              {status === "draft"
                ? "This removes the draft bill and its lines. This cannot be undone."
                : "The bill will be marked as canceled. This cannot be undone from this screen."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="rounded-lg"
              disabled={pending}
              onClick={() => setCancelOpen(false)}
            >
              Back
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="rounded-lg"
              disabled={pending}
              onClick={() => runCancel()}
            >
              {pending ? "Working…" : "Cancel order"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
