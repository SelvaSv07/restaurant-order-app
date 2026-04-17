"use client";

import { useState } from "react";
import { Pencil, Plus, X } from "lucide-react";

import { applyDiscountAction } from "@/app/(app)/billing/discount-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

function isActiveDiscount(
  discountType: "none" | "fixed" | "percent",
  discountValue: number,
) {
  return discountType !== "none" && discountValue > 0;
}

type Props = {
  billId: number;
  discountType: "none" | "fixed" | "percent";
  discountValue: number;
};

export function BillingDiscountControl({ billId, discountType, discountValue }: Props) {
  const active = isActiveDiscount(discountType, discountValue);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState<"fixed" | "percent">(
    discountType === "percent" ? "percent" : "fixed",
  );
  const [formValue, setFormValue] = useState(
    active ? String(discountValue) : "",
  );

  const openNew = () => {
    setFormType("fixed");
    setFormValue("");
    setShowForm(true);
  };

  const openEdit = () => {
    setFormType(discountType === "percent" ? "percent" : "fixed");
    setFormValue(String(discountValue));
    setShowForm(true);
  };

  const cancelEdit = () => {
    setShowForm(false);
    if (active) {
      setFormType(discountType === "percent" ? "percent" : "fixed");
      setFormValue(String(discountValue));
    }
  };

  return (
    <div className="mt-3 border-t border-[#d6d6d6] pt-3">
      {!showForm && !active ? (
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#454545]">Discount</h3>
          <button
            type="button"
            onClick={openNew}
            className={cn(
              "inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-[#f97316] text-[#f97316] transition-colors",
              "hover:bg-orange-50",
            )}
            aria-label="Add discount"
          >
            <Plus className="size-4" strokeWidth={2} />
          </button>
        </div>
      ) : null}

      {!showForm && active ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <h3 className="shrink-0 text-sm font-semibold text-[#454545]">Discount</h3>
            <span
              className={cn(
                "inline-flex max-w-full min-w-0 truncate rounded-full px-2.5 py-0.5 text-xs font-semibold",
                "bg-[#fff7ed] text-[#ea580c] ring-1 ring-[#fed7aa]/80",
              )}
            >
              {discountType === "fixed" ? formatINR(discountValue) : `${discountValue}%`}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={openEdit}
              className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-[#7a7a7a] transition-colors hover:bg-zinc-100 hover:text-[#454545]"
              aria-label="Edit discount"
            >
              <Pencil className="size-4" />
            </button>
            <form action={applyDiscountAction} className="inline">
              <input type="hidden" name="billId" value={billId} />
              <input type="hidden" name="discountType" value="none" />
              <input type="hidden" name="discountValue" value={0} />
              <button
                type="submit"
                className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full text-[#ef4444] transition-colors hover:bg-red-50"
                aria-label="Remove discount"
              >
                <X className="size-4" />
              </button>
            </form>
          </div>
        </div>
      ) : null}

      {showForm ? (
        <form action={applyDiscountAction} className="space-y-3">
          <input type="hidden" name="billId" value={billId} />
          <input type="hidden" name="discountType" value={formType} />
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-[#454545]">Discount</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-xs font-medium text-[#7a7a7a] hover:text-[#454545]"
              onClick={cancelEdit}
            >
              Cancel
            </Button>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <Select
              value={formType}
              onValueChange={(v) => v && setFormType(v as "fixed" | "percent")}
            >
              <SelectTrigger
                className="h-9 min-w-0 flex-1 rounded-full border border-[#d6d6d6] bg-white px-2.5 py-2 text-xs font-medium text-[#454545] sm:px-3"
                size="default"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value="fixed">Fixed (₹)</SelectItem>
                <SelectItem value="percent">Percent (%)</SelectItem>
              </SelectContent>
            </Select>
            <Input
              name="discountValue"
              type="number"
              min={0}
              step={1}
              max={formType === "percent" ? 100 : undefined}
              value={formValue}
              onChange={(e) => setFormValue(e.target.value)}
              placeholder={formType === "percent" ? "%" : "₹"}
              className="h-9 w-[4.5rem] shrink-0 rounded-full border-[#d6d6d6] px-3 text-xs sm:w-24"
              required
            />
            <Button type="submit" variant="outline" size="sm" className="h-9 shrink-0 rounded-full px-3 text-xs">
              Apply
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
