"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { BillDetailDialog } from "@/components/app/bill-detail-dialog";
import { BillsRowActions } from "@/components/app/bills-row-actions";
import { formatIstParts, OrderTypeBadge, StatusBadge } from "@/components/app/bills-order-display";
import { Input } from "@/components/ui/input";
import { formatINR, shouldHideDraftZeroAmount, shouldHideDraftZeroQty } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type BillRow = {
  id: number;
  billNumber: string;
  status: "draft" | "completed" | "voided";
  orderType: "dine_in" | "takeaway";
  totalRupee: number;
  createdAt: Date;
};

type Row = {
  bill: BillRow;
  menuLabel: string;
  qty: number;
};

export function RecentOrdersTable({ rows }: { rows: Row[] }) {
  const [detailBillId, setDetailBillId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetail = (billId: number) => {
    setDetailBillId(billId);
    setDetailOpen(true);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full max-w-[237px]">
            <Input
              readOnly
              placeholder="Search order"
              className="h-9 rounded-[10px] border-0 bg-[#f7f7f7] pl-3 text-xs text-[#858585] ring-0 placeholder:text-[#858585]"
            />
          </label>
          <Link
            href="/bills"
            className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-xl bg-[#ff6b1e] px-4 text-sm font-semibold text-white transition hover:bg-[#f55f0f] sm:w-auto"
          >
            See All Orders
          </Link>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-[#ebebeb] hover:bg-transparent">
                <TableHead className="text-xs font-normal text-[#858585]">
                  <span className="inline-flex items-center gap-1">
                    Order ID
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </span>
                </TableHead>
                <TableHead className="text-xs font-normal text-[#858585]">
                  <span className="inline-flex items-center gap-1">
                    Date
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </span>
                </TableHead>
                <TableHead className="text-xs font-normal text-[#858585]">
                  <span className="inline-flex items-center gap-1">
                    Time
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </span>
                </TableHead>
                <TableHead className="text-center text-xs font-normal text-[#858585]">
                  <span className="inline-flex items-center justify-center gap-1">
                    Order type
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </span>
                </TableHead>
                <TableHead className="text-right text-xs font-normal text-[#858585]">Qty</TableHead>
                <TableHead className="text-right text-xs font-normal text-[#858585]">
                  <span className="inline-flex w-full items-center justify-end gap-1">
                    Amount
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </span>
                </TableHead>
                <TableHead className="text-center text-xs font-normal text-[#858585]">
                  <span className="inline-flex items-center justify-center gap-1">
                    Status
                    <ArrowUpDown className="size-3.5 opacity-60" />
                  </span>
                </TableHead>
                <TableHead className="w-10 p-2 text-right text-[#858585]">
                  <span className="sr-only">Row menu</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-12 text-center text-sm text-[#858585]">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map(({ bill, qty }) => {
                  const { dateLine, timeLine } = formatIstParts(bill.createdAt);
                  return (
                    <TableRow
                      key={bill.id}
                      className="cursor-pointer border-[#ebebeb] hover:bg-[#fafafa]"
                      onClick={() => openDetail(bill.id)}
                    >
                      <TableCell className="align-middle">
                        <span className="text-sm font-medium text-[#333]">ORD-{bill.billNumber}</span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-sm font-medium text-[#333]">{dateLine}</span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-sm tabular-nums text-[#333]">{timeLine}</span>
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <OrderTypeBadge orderType={bill.orderType} />
                      </TableCell>
                      <TableCell className="align-middle text-right text-sm tabular-nums">
                        {shouldHideDraftZeroQty(bill.status, qty) ? (
                          <span className="font-medium text-[#858585]">—</span>
                        ) : (
                          <span className="text-[#333]">{qty}</span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle text-right text-sm font-semibold tabular-nums">
                        {shouldHideDraftZeroAmount(bill.status, bill.totalRupee) ? (
                          <span className="font-medium text-[#858585]">—</span>
                        ) : (
                          <span className="text-[#ff6b1e]">{formatINR(bill.totalRupee)}</span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle text-center">
                        <StatusBadge status={bill.status} />
                      </TableCell>
                      <TableCell className="align-middle text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end">
                          <BillsRowActions billId={bill.id} status={bill.status} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <BillDetailDialog
        billId={detailBillId}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailBillId(null);
        }}
      />
    </>
  );
}
