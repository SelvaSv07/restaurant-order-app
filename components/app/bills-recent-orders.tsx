import Link from "next/link";
import type { InferSelectModel } from "drizzle-orm";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { bills } from "@/lib/db/schema";
import { formatINR } from "@/lib/money";

type BillRow = InferSelectModel<typeof bills>;
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type BillsStatusTab = "all" | "draft" | "completed" | "voided";

function formatIstParts(date: Date) {
  const d = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const t = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
  return { dateLine: d.replaceAll("/", "-"), timeLine: t };
}

function StatusBadge({ status }: { status: "draft" | "completed" | "voided" }) {
  if (status === "completed") {
    return (
      <span className="inline-flex rounded-md bg-[#ff6b1e] px-2 py-1 text-xs leading-none text-white">
        Completed
      </span>
    );
  }
  if (status === "voided") {
    return (
      <span className="inline-flex rounded-md bg-[#333] px-2 py-1 text-xs leading-none text-[#f9f9f9]">
        Canceled
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-md bg-[#fdcea1] px-2 py-1 text-xs leading-none text-[#333]">
      On Process
    </span>
  );
}

function OrderTypeBadge({ orderType }: { orderType: "dine_in" | "takeaway" }) {
  const isTakeaway = orderType === "takeaway";
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-[#f7f7f7] px-2 py-1 text-xs text-[#333]">
      <span
        className={cn("size-2 shrink-0 rounded-full", isTakeaway ? "bg-[#fdcea1]" : "bg-[#ff6b1e]")}
      />
      {isTakeaway ? "Takeaway" : "Dine-in"}
    </span>
  );
}

export function BillsRecentOrders({
  rows,
  lineQtyByBillId,
  total,
  page,
  pageSize,
  status,
  tabLinks,
  pagination,
}: {
  rows: BillRow[];
  lineQtyByBillId: Map<number, number>;
  total: number;
  page: number;
  pageSize: number;
  status: BillsStatusTab;
  tabLinks: Record<BillsStatusTab, string>;
  pagination: {
    prev: string | null;
    next: string | null;
    items: { type: "page" | "ellipsis"; value?: number; href?: string; active?: boolean }[];
  };
}) {
  const tabs: { id: BillsStatusTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "draft", label: "On Process" },
    { id: "completed", label: "Completed" },
    { id: "voided", label: "Canceled" },
  ];

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="rounded-xl bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-[#ebebeb] p-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-semibold text-[#333]">Recent orders</h2>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tabLinks[tab.id]}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-semibold transition-colors",
                status === tab.id
                  ? "bg-[#ff6b1e] text-white"
                  : "bg-[#f7f7f7] text-[#858585] hover:bg-[#ebebeb]",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto p-4 pt-0">
        <Table>
          <TableHeader>
            <TableRow className="border-[#ebebeb] hover:bg-transparent">
              <TableHead className="w-10 text-[#858585]">
                <span className="sr-only">Select</span>
              </TableHead>
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
              <TableHead className="text-xs font-normal text-[#858585]">Customer</TableHead>
              <TableHead className="text-xs font-normal text-[#858585]">
                <span className="inline-flex items-center gap-1">
                  Order type
                  <ArrowUpDown className="size-3.5 opacity-60" />
                </span>
              </TableHead>
              <TableHead className="min-w-[120px] text-xs font-normal text-[#858585]">Address</TableHead>
              <TableHead className="text-center text-xs font-normal text-[#858585]">Qty</TableHead>
              <TableHead className="text-xs font-normal text-[#858585]">
                <span className="inline-flex items-center gap-1">
                  Amount
                  <ArrowUpDown className="size-3.5 opacity-60" />
                </span>
              </TableHead>
              <TableHead className="text-xs font-normal text-[#858585]">
                <span className="inline-flex items-center gap-1">
                  Status
                  <ArrowUpDown className="size-3.5 opacity-60" />
                </span>
              </TableHead>
              <TableHead className="text-xs font-normal text-[#858585]">Print</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-12 text-center text-sm text-[#858585]">
                  No orders match your filters.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((bill) => {
                const { dateLine, timeLine } = formatIstParts(bill.createdAt);
                const qty = lineQtyByBillId.get(bill.id) ?? 0;
                return (
                  <TableRow key={bill.id} className="border-[#ebebeb]">
                    <TableCell className="align-middle">
                      <input
                        type="checkbox"
                        disabled
                        className="pointer-events-none size-3.5 rounded border-[#dedede] accent-[#ff6b1e]"
                        aria-hidden
                      />
                    </TableCell>
                    <TableCell className="align-middle">
                      <Link
                        href={`/print/${bill.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-[#333] underline-offset-2 hover:underline"
                      >
                        ORD-{bill.billNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="align-middle">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-[#333]">{dateLine}</span>
                        <span className="text-xs text-[#858585]">{timeLine}</span>
                      </div>
                    </TableCell>
                    <TableCell className="align-middle text-sm text-[#858585]">—</TableCell>
                    <TableCell className="align-middle">
                      <OrderTypeBadge orderType={bill.orderType} />
                    </TableCell>
                    <TableCell className="align-middle">
                      <span className="inline-block rounded-md bg-[#f7f7f7] px-2 py-1 text-xs text-[#858585]">
                        —
                      </span>
                    </TableCell>
                    <TableCell className="align-middle text-center text-sm text-[#333]">{qty}</TableCell>
                    <TableCell className="align-middle text-sm font-semibold text-[#ff6b1e]">
                      {formatINR(bill.totalRupee)}
                    </TableCell>
                    <TableCell className="align-middle">
                      <StatusBadge status={bill.status} />
                    </TableCell>
                    <TableCell className="align-middle">
                      <Link
                        href={`/print/${bill.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-[#ff6b1e] underline"
                      >
                        Reprint
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-3 border-t border-[#ebebeb] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#858585]">
          Showing{" "}
          <span className="inline-flex items-center gap-1 font-medium text-[#333]">
            <span className="rounded-md border border-[#ebebeb] bg-white px-2 py-0.5 text-xs">{pageSize}</span>
          </span>{" "}
          <span className="text-[#333]">
            {from}-{to} of {total}
          </span>
        </p>
        <div className="flex flex-wrap items-center justify-end gap-1">
          {pagination.prev ? (
            <Link
              href={pagination.prev}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-[#ebebeb] bg-white text-[#333] hover:bg-[#f7f7f7]"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-[#ebebeb] bg-[#f7f7f7] text-[#bebfc2]">
              <ChevronLeft className="size-4" />
            </span>
          )}
          {pagination.items.map((item, i) =>
            item.type === "ellipsis" ? (
              <span key={`e-${i}`} className="px-2 text-sm text-[#858585]">
                …
              </span>
            ) : (
              <Link
                key={`${item.href}-${item.value}`}
                href={item.href!}
                className={cn(
                  "inline-flex min-w-9 items-center justify-center rounded-lg border px-2 py-1.5 text-sm",
                  item.active
                    ? "border-[#ff6b1e] bg-[#ff6b1e] font-semibold text-white"
                    : "border-[#ebebeb] bg-white text-[#333] hover:bg-[#f7f7f7]",
                )}
              >
                {item.value}
              </Link>
            ),
          )}
          {pagination.next ? (
            <Link
              href={pagination.next}
              className="inline-flex size-9 items-center justify-center rounded-lg border border-[#ebebeb] bg-white text-[#333] hover:bg-[#f7f7f7]"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="inline-flex size-9 items-center justify-center rounded-lg border border-[#ebebeb] bg-[#f7f7f7] text-[#bebfc2]">
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
