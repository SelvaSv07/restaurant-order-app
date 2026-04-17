"use client";

import { createContext, useContext, useState } from "react";
import { toast } from "sonner";

import { markDineInKotPrintedAction } from "@/app/(app)/dine-in/actions";
import { printKotToConfiguredDevice } from "@/lib/print-client";
import { BillingDiscountControl } from "@/components/billing/billing-discount";
import { CompleteBillForm } from "@/components/billing/complete-bill-form";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

type SettlementCtx = { onBackToOrder: () => void };

const DineInSettlementContext = createContext<SettlementCtx | null>(null);

export function useDineInSettlementBack() {
  const ctx = useContext(DineInSettlementContext);
  if (!ctx) {
    throw new Error("useDineInSettlementBack must be used within dine-in settlement");
  }
  return ctx;
}

type PaymentCardProps = {
  billId: number;
  subtotalRupee: number;
  discountRupee: number;
  totalRupee: number;
  discountType: "none" | "fixed" | "percent";
  discountValue: number;
  placeOrderDisabled: boolean;
};

/** Payment panel shown after “Settle bill”; must be rendered inside `DineInCheckoutFlow` when settlement is active. */
export function DineInPaymentDetailsCard({
  billId,
  subtotalRupee,
  discountRupee,
  totalRupee,
  discountType,
  discountValue,
  placeOrderDisabled,
}: PaymentCardProps) {
  const { onBackToOrder } = useDineInSettlementBack();

  return (
    <div className="rounded-[15px] border border-[#d6d6d6] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-base font-semibold text-[#454545]">Payment details</p>
        <button
          type="button"
          onClick={onBackToOrder}
          className={cn(
            "cursor-pointer shrink-0 text-sm font-medium text-[#f97316] underline-offset-2",
            "hover:underline",
          )}
        >
          Back to order
        </button>
      </div>
      <dl className="mt-4 space-y-3 text-sm font-semibold text-[#454545]">
        <div className="flex justify-between gap-4">
          <dt>Subtotal</dt>
          <dd>{formatINR(subtotalRupee)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Taxes</dt>
          <dd>{formatINR(0)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Discount</dt>
          <dd>{formatINR(discountRupee)}</dd>
        </div>
        <div className="h-px bg-[#d6d6d6]" />
        <div className="flex justify-between gap-4 text-base font-extrabold">
          <dt>Total</dt>
          <dd className="text-[#f97316]">{formatINR(totalRupee)}</dd>
        </div>
      </dl>

      <BillingDiscountControl
        key={`${discountType}-${discountValue}`}
        billId={billId}
        discountType={discountType}
        discountValue={discountValue}
      />

      <CompleteBillForm billId={billId} disabled={placeOrderDisabled} />
    </div>
  );
}

type Props = {
  billId: number;
  hasLines: boolean;
  /** Any line qty not yet marked as sent to kitchen (Update order) */
  hasUnsentLines: boolean;
  children: React.ReactNode;
};

export function DineInCheckoutFlow({
  billId,
  hasLines,
  hasUnsentLines,
  children,
}: Props) {
  const [settlement, setSettlement] = useState(false);
  const [pending, setPending] = useState<"update" | "settle" | null>(null);

  const runKotUpdate = async () => {
    if (!hasUnsentLines || pending) return;
    setPending("update");
    try {
      const printed = await printKotToConfiguredDevice(billId);
      if (!printed) return;
      const result = await markDineInKotPrintedAction(billId);
      if (!result.ok) return;
      if (result.rows.length > 0) {
        const detail = result.rows.map((r) => `${r.name} ×${r.qty}`).join(", ");
        toast.success("Sent to kitchen (KOT)", { description: detail });
      }
    } finally {
      setPending(null);
    }
  };

  const onSettleBill = async () => {
    if (!hasLines || pending) return;
    if (hasUnsentLines) {
      setPending("settle");
      try {
        const printed = await printKotToConfiguredDevice(billId);
        if (!printed) return;
        const result = await markDineInKotPrintedAction(billId);
        if (!result.ok) return;
        if (result.rows.length > 0) {
          const detail = result.rows.map((r) => `${r.name} ×${r.qty}`).join(", ");
          toast.success("Sent to kitchen (KOT)", { description: detail });
        }
      } finally {
        setPending(null);
      }
    }
    setSettlement(true);
  };

  return (
    <>
      <div
        className={cn(
          "space-y-4",
          settlement ? "mt-3 pt-0" : "mt-4 border-t border-[#d6d6d6] pt-4",
        )}
      >
        {!settlement ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            <Button
              type="button"
              disabled={!hasUnsentLines || pending !== null}
              className="h-11 w-full rounded-full border-0 bg-[#f97316] text-base font-semibold text-white hover:bg-[#ea580c] sm:flex-1 disabled:opacity-50"
              onClick={() => void runKotUpdate()}
            >
              {pending === "update" ? "Updating…" : "Update order"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={!hasLines || pending !== null}
              className="h-11 w-full rounded-full border-[#d6d6d6] text-base font-semibold text-[#454545] sm:flex-1 disabled:opacity-50"
              onClick={() => void onSettleBill()}
            >
              {pending === "settle" ? "Settling…" : "Settle bill"}
            </Button>
          </div>
        ) : (
          <DineInSettlementContext.Provider value={{ onBackToOrder: () => setSettlement(false) }}>
            {children}
          </DineInSettlementContext.Provider>
        )}
      </div>
    </>
  );
}
