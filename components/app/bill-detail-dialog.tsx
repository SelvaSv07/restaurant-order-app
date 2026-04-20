"use client";

import { useEffect, useState } from "react";

import { getBillDetailAction } from "@/app/(app)/bills/actions";
import { OrderTypeBadge, StatusBadge } from "@/components/app/bills-order-display";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatBillNumberDisplay } from "@/lib/bill-number-display";
import { formatINR } from "@/lib/money";
import { printReceiptToConfiguredDevice } from "@/lib/print-client";
function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d);
}

function formatIstParts(date: Date | string) {
  const dt = toDate(date);
  const dateLine = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(dt);
  const timeLine = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(dt);
  return { dateLine: dateLine.replaceAll("/", "-"), timeLine };
}

function paymentLabel(method: "cash" | "card" | "upi" | "other" | null | undefined) {
  if (!method) return "—";
  const m: Record<"cash" | "card" | "upi" | "other", string> = {
    cash: "Cash",
    card: "Card",
    upi: "UPI",
    other: "Other",
  };
  return m[method] ?? String(method);
}

type DetailResult = Awaited<ReturnType<typeof getBillDetailAction>>;

function BillDetailBody({
  billId,
  onOpenChange,
}: {
  billId: number;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, setState] = useState<{
    loading: boolean;
    data: Extract<DetailResult, { ok: true }> | null;
    failed: boolean;
  }>({ loading: true, data: null, failed: false });

  useEffect(() => {
    let cancelled = false;
    getBillDetailAction(billId).then((result) => {
      if (cancelled) return;
      if (result.ok) {
        setState({ loading: false, data: result, failed: false });
      } else {
        setState({ loading: false, data: null, failed: true });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [billId]);

  const bill = state.data?.bill;
  const lines = state.data?.lines ?? [];
  const tableName = state.data?.tableName ?? null;
  const showReprint = bill && bill.status !== "draft" && bill.status !== "voided";

  const runReprint = () => {
    void printReceiptToConfiguredDevice(billId);
  };

  return (
    <>
      <div className="max-h-[min(90vh,720px)] overflow-y-auto p-6">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg">
            {bill ? formatBillNumberDisplay(bill.billNumber) : "Bill details"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Order line items and totals for this bill.
          </DialogDescription>
        </DialogHeader>

        {state.loading ? (
          <p className="py-8 text-sm text-[#858585]">Loading…</p>
        ) : state.failed || !bill ? (
          <p className="py-8 text-sm text-[#858585]">Could not load this bill.</p>
        ) : (
            <div className="mt-4 space-y-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-[#858585]">Date</dt>
                <dd className="text-right font-medium text-[#333]">{formatIstParts(bill.createdAt).dateLine}</dd>
                <dt className="text-[#858585]">Time</dt>
                <dd className="text-right tabular-nums text-[#333]">{formatIstParts(bill.createdAt).timeLine}</dd>
                <dt className="text-[#858585]">Type</dt>
                <dd className="flex justify-end">
                  <OrderTypeBadge orderType={bill.orderType} />
                </dd>
                <dt className="text-[#858585]">Status</dt>
                <dd className="flex justify-end">
                  <StatusBadge status={bill.status} />
                </dd>
                {bill.orderType === "dine_in" ? (
                  <>
                    <dt className="text-[#858585]">Table</dt>
                    <dd className="text-right font-medium text-[#333]">{tableName ?? "—"}</dd>
                  </>
                ) : null}
                <dt className="text-[#858585]">Payment</dt>
                <dd className="text-right text-[#333]">{paymentLabel(bill.paymentMethod)}</dd>
              </dl>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-[#858585]">Items</p>
                <div className="overflow-hidden rounded-lg border border-[#ebebeb]">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[#ebebeb] hover:bg-transparent">
                        <TableHead className="text-xs font-normal text-[#858585]">Product</TableHead>
                        <TableHead className="w-16 text-right text-xs font-normal text-[#858585]">Qty</TableHead>
                        <TableHead className="w-24 text-right text-xs font-normal text-[#858585]">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-sm text-[#858585]">
                            No line items.
                          </TableCell>
                        </TableRow>
                      ) : (
                        lines.map((line) => (
                          <TableRow key={line.id} className="border-[#ebebeb]">
                            <TableCell className="max-w-[200px] text-sm font-medium text-[#333]">
                              {line.productNameSnapshot}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums text-[#333]">{line.qty}</TableCell>
                            <TableCell className="text-right text-sm font-medium tabular-nums text-[#ff6b1e]">
                              {formatINR(line.lineTotalRupee)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <dl className="space-y-1.5 border-t border-[#ebebeb] pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#858585]">Subtotal</dt>
                  <dd className="tabular-nums text-[#333]">{formatINR(bill.subtotalRupee)}</dd>
                </div>
                {bill.discountType !== "none" && bill.discountRupee > 0 ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-[#858585]">
                      Discount
                      {bill.discountType === "percent" ? ` (${bill.discountValue}%)` : ""}
                    </dt>
                    <dd className="tabular-nums text-[#333]">−{formatINR(bill.discountRupee)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between gap-4 border-t border-[#ebebeb] pt-2 text-base font-semibold">
                  <dt className="text-[#333]">Total</dt>
                  <dd className="tabular-nums text-[#ff6b1e]">{formatINR(bill.totalRupee)}</dd>
                </div>
              </dl>
            </div>
          )}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#ebebeb] bg-[#fafafa] p-4 sm:flex-row sm:justify-end">
        {showReprint ? (
          <Button
            type="button"
            className="rounded-lg border-0 bg-[#ff6b1e] text-white hover:bg-[#ea580c]"
            onClick={runReprint}
          >
            Reprint
          </Button>
        ) : null}
        <Button type="button" variant="outline" className="rounded-lg" onClick={() => onOpenChange(false)}>
          Close
        </Button>
      </div>
    </>
  );
}

export function BillDetailDialog({
  billId,
  open,
  onOpenChange,
}: {
  billId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-h-[min(90vh,720px)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        {open && billId != null ? (
          <BillDetailBody key={billId} billId={billId} onOpenChange={onOpenChange} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
