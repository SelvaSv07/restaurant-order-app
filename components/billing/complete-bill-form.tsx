"use client";

import { useState } from "react";
import { toast } from "sonner";

import { completeBillAction } from "@/app/(app)/billing/order-actions";
import { Button } from "@/components/ui/button";
import { printReceiptToConfiguredDevice, printKotToConfiguredDevice } from "@/lib/print-client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CompleteBillForm({ billId, disabled }: { billId: number; disabled: boolean }) {
  const [paymentMethod, setPaymentMethod] = useState("cash");

  return (
    <form
      className="mt-4 space-y-3"
      action={async (formData) => {
        try {
          const result = await completeBillAction(formData);
          if (!result.ok) {
            toast.error("Could not complete order");
            return;
          }
          toast.success("Bill completed");
          await Promise.all([
            printReceiptToConfiguredDevice(billId),
            printKotToConfiguredDevice(billId),
          ]);
        } catch {
          toast.error("Could not complete order");
        }
      }}
    >
      <input type="hidden" name="billId" value={billId} />
      <input type="hidden" name="paymentMethod" value={paymentMethod} />
      <h3 className="text-sm font-semibold text-[#454545]">Payment method</h3>
      <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v ?? "cash")}>
        <SelectTrigger
          className="h-10 w-full min-w-0 cursor-pointer rounded-full border border-[#d6d6d6] bg-white px-4 text-sm font-medium text-[#454545] shadow-none"
          size="default"
        >
          <SelectValue placeholder="Select payment method" />
        </SelectTrigger>
        <SelectContent side="bottom" sideOffset={8} align="start" className="z-[100]">
          <SelectItem value="cash">Cash</SelectItem>
          <SelectItem value="card">Card</SelectItem>
          <SelectItem value="upi">UPI</SelectItem>
          <SelectItem value="other">Other</SelectItem>
        </SelectContent>
      </Select>
      <Button
        type="submit"
        disabled={disabled}
        className="h-10 w-full rounded-full border-0 bg-[#f97316] text-base font-semibold text-white hover:bg-[#ea580c]"
      >
        Place order
      </Button>
    </form>
  );
}
