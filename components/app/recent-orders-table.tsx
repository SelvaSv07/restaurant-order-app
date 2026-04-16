import Link from "next/link";

import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/money";

type BillRow = {
  id: number;
  billNumber: string;
  status: "draft" | "completed" | "voided";
  orderType: "dine_in" | "takeaway";
  totalRupee: number;
};

type Row = {
  bill: BillRow;
  menuLabel: string;
  qty: number;
};

function statusStyle(status: string) {
  if (status === "draft") {
    return { label: "On Process", className: "bg-[#fdcea1] text-[#333]" };
  }
  if (status === "voided") {
    return { label: "Cancelled", className: "bg-[#333] text-[#f9f9f9]" };
  }
  return { label: "Completed", className: "bg-[#ff6b1e] text-[#f9f9f9]" };
}

export function RecentOrdersTable({ rows }: { rows: Row[] }) {
  return (
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

      <div className="overflow-x-auto rounded-lg">
        <div className="min-w-[760px]">
          <div className="flex items-center justify-between gap-2 rounded-lg bg-[#f7f7f7] px-4 py-3.5 text-xs text-[#858585]">
            <span className="w-[72px] shrink-0 font-normal">Order ID</span>
            <span className="w-16 shrink-0 text-center">Photo</span>
            <span className="min-w-[120px] flex-1">Menu</span>
            <span className="w-10 shrink-0 text-center">Qty</span>
            <span className="w-[72px] shrink-0 text-right">Amount</span>
            <span className="w-20 shrink-0 text-center">Type</span>
            <span className="w-24 shrink-0 text-center">Status</span>
          </div>
          <div className="divide-y divide-[#ebebeb]">
            {rows.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[#858585]">No orders yet.</p>
            ) : (
              rows.map(({ bill, menuLabel, qty }) => {
                const st = statusStyle(bill.status);
                return (
                  <div
                    key={bill.id}
                    className="flex items-center justify-between gap-2 bg-white px-4 py-3 text-xs text-[#333]"
                  >
                    <span className="w-[72px] shrink-0 font-medium">#{bill.billNumber}</span>
                    <div className="flex w-16 shrink-0 justify-center">
                      <div className="size-10 rounded-lg bg-[#ebebeb]" />
                    </div>
                    <span className="min-w-0 flex-1 truncate font-medium">{menuLabel}</span>
                    <span className="w-10 shrink-0 text-center tabular-nums">{qty}</span>
                    <span className="w-[72px] shrink-0 text-right font-semibold tabular-nums">
                      {formatINR(bill.totalRupee)}
                    </span>
                    <span className="w-20 shrink-0 text-center text-[#858585]">
                      {bill.orderType === "dine_in" ? "Dine-in" : "Takeaway"}
                    </span>
                    <div className="flex w-24 shrink-0 justify-center">
                      <span
                        className={`inline-flex items-center justify-center rounded-md px-2 py-1 text-[12px] leading-tight ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
