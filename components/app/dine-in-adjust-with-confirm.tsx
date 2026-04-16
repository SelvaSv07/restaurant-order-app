"use client";

import { useState, useTransition } from "react";
import { CircleMinus, Trash2, TriangleAlert } from "lucide-react";

import { adjustDineInLineQtyAction, removeDineInLineAction } from "@/app/(app)/dine-in/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DecreaseProps = {
  lineId: number;
  qtyKotSent: number;
  className?: string;
  iconSizeClass?: string;
  "aria-label"?: string;
};

type DecreaseSentProps = {
  lineId: number;
  qtyKotSent: number;
  className?: string;
  iconSizeClass?: string;
  "aria-label"?: string;
};

/** Decrease qty that was already sent to the kitchen (updates qty + qtyKotSent). Always confirms first. */
export function DineInDecreaseSentWithConfirm({
  lineId,
  qtyKotSent,
  className,
  iconSizeClass = "size-[22px]",
  "aria-label": ariaLabel = "Reduce quantity sent to kitchen",
}: DecreaseSentProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () => {
    const fd = new FormData();
    fd.set("lineId", String(lineId));
    fd.set("delta", "-1");
    fd.set("reduceSent", "true");
    startTransition(() => void adjustDineInLineQtyAction(fd));
  };

  if (qtyKotSent <= 0) return null;

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className={cn("flex cursor-pointer text-[#f97316] transition-opacity hover:opacity-80 disabled:opacity-50", className)}
        aria-label={ariaLabel}
        onClick={() => setOpen(true)}
      >
        <CircleMinus className={iconSizeClass} strokeWidth={1.5} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-md"
          showCloseButton
        >
          <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
            <DialogHeader className="gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/80">
                  <TriangleAlert className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle className="text-left text-lg font-semibold tracking-tight text-[#333]">
                    Reduce quantity already sent?
                  </DialogTitle>
                  <DialogDescription className="text-left text-[13px] leading-snug text-[#858585]">
                    This lowers both the bill and the &quot;sent to kitchen&quot; count. Confirm with the kitchen if they
                    have already started the dish.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-[#ebebeb] bg-[#fafafa] px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-[#ebebeb] bg-white font-semibold text-[#454545] hover:bg-[#f7f7f7] sm:min-w-[100px]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full border-0 bg-[#f97316] font-semibold text-white hover:bg-[#ea580c] sm:min-w-[120px]"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                run();
              }}
            >
              {pending ? "Updating…" : "Reduce"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Decrease qty; if part of the line was already sent to the kitchen, confirm first. */
export function DineInDecreaseWithConfirm({
  lineId,
  qtyKotSent,
  className,
  iconSizeClass = "size-6",
  "aria-label": ariaLabel = "Decrease quantity",
}: DecreaseProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () => {
    const fd = new FormData();
    fd.set("lineId", String(lineId));
    fd.set("delta", "-1");
    startTransition(() => void adjustDineInLineQtyAction(fd));
  };

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className={cn("flex cursor-pointer text-[#f97316] transition-opacity hover:opacity-80 disabled:opacity-50", className)}
        aria-label={ariaLabel}
        onClick={() => {
          if (qtyKotSent > 0) setOpen(true);
          else run();
        }}
      >
        <CircleMinus className={iconSizeClass} strokeWidth={1.5} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-md"
          showCloseButton
        >
          <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
            <DialogHeader className="gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/80">
                  <TriangleAlert className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle className="text-left text-lg font-semibold tracking-tight text-[#333]">
                    Reduce this order?
                  </DialogTitle>
                  <DialogDescription className="text-left text-[13px] leading-snug text-[#858585]">
                    Part of this item was already sent to the kitchen. Reducing here only removes quantities not yet
                    sent. If you need to change what the kitchen is preparing, speak with the kitchen first.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-[#ebebeb] bg-[#fafafa] px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-[#ebebeb] bg-white font-semibold text-[#454545] hover:bg-[#f7f7f7] sm:min-w-[100px]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full border-0 bg-[#f97316] font-semibold text-white hover:bg-[#ea580c] sm:min-w-[120px]"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                run();
              }}
            >
              {pending ? "Updating…" : "Reduce"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

type RemoveProps = {
  lineId: number;
  qtyKotSent: number;
  className?: string;
  trashIconClassName?: string;
  "aria-label"?: string;
};

/** Remove line; if anything was sent to the kitchen, confirm first. */
export function DineInRemoveLineWithConfirm({
  lineId,
  qtyKotSent,
  className,
  trashIconClassName = "size-[18px]",
  "aria-label": ariaLabel = "Remove line",
}: RemoveProps) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () => {
    const fd = new FormData();
    fd.set("lineId", String(lineId));
    startTransition(() => void removeDineInLineAction(fd));
  };

  return (
    <>
      <button
        type="button"
        disabled={pending}
        className={className}
        aria-label={ariaLabel}
        onClick={() => {
          if (qtyKotSent > 0) setOpen(true);
          else run();
        }}
      >
        <Trash2 className={trashIconClassName} strokeWidth={2} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-[calc(100%-2rem)] gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_4px_24px_rgba(51,51,51,0.08)] ring-1 ring-[#ebebeb] sm:max-w-md"
          showCloseButton
        >
          <div className="border-b border-[#ebebeb] px-5 pb-4 pt-5">
            <DialogHeader className="gap-3">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600 ring-1 ring-amber-200/80">
                  <TriangleAlert className="size-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1 space-y-1">
                  <DialogTitle className="text-left text-lg font-semibold tracking-tight text-[#333]">
                    Remove items sent to the kitchen?
                  </DialogTitle>
                  <DialogDescription className="text-left text-[13px] leading-snug text-[#858585]">
                    This line includes quantities already sent to the kitchen. Removing it drops the whole line from the
                    bill — confirm only if that matches what actually happened at the pass.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-[#ebebeb] bg-[#fafafa] px-5 py-4 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-10 rounded-full border-[#ebebeb] bg-white font-semibold text-[#454545] hover:bg-[#f7f7f7] sm:min-w-[100px]"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="h-10 rounded-full border-0 bg-red-600 font-semibold text-white hover:bg-red-700 sm:min-w-[120px]"
              disabled={pending}
              onClick={() => {
                setOpen(false);
                run();
              }}
            >
              {pending ? "Removing…" : "Remove line"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
