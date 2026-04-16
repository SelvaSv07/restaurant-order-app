import { ArrowUpDown } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";

import { InventoryPagination } from "@/components/app/inventory-pagination";
import { InventoryStatusBadge } from "@/components/app/inventory-status-badge";
import { InventoryUpdateStockDialog } from "@/components/app/inventory-update-stock-dialog";
import { inventoryItems } from "@/lib/db/schema";
import { getInventoryStatus } from "@/lib/inventory";

type Row = InferSelectModel<typeof inventoryItems>;

function SortLabel({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "center" | "right" }) {
  const alignClass = align === "center" ? "justify-center" : align === "right" ? "justify-end" : "justify-start";
  return (
    <div className={`flex ${alignClass}`}>
      <span className="inline-flex items-center gap-1 text-xs font-normal text-[#858585]">
        {children}
        <ArrowUpDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
      </span>
    </div>
  );
}

export function InventoryProductsTable({
  rows,
  page,
  pageSize,
  totalFiltered,
  hrefForPage,
}: {
  rows: Row[];
  page: number;
  pageSize: number;
  totalFiltered: number;
  hrefForPage: (p: number) => string;
}) {
  return (
    <div className="w-full min-w-0">
      <div className="overflow-x-auto rounded-xl border border-[#ebebeb] bg-white">
        <div className="min-w-[640px]">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(112px,120px)_minmax(88px,96px)_minmax(100px,120px)] items-center gap-x-3 gap-y-1 border-b border-[#ebebeb] px-4 py-3.5">
            <SortLabel>Item</SortLabel>
            <SortLabel align="center">Status</SortLabel>
            <SortLabel align="right">Qty in Stock</SortLabel>
            <SortLabel align="right">Action</SortLabel>
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-[#858585]">No items match your filters.</p>
          ) : (
            rows.map((item) => {
              const status = getInventoryStatus(item);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[minmax(0,1fr)_minmax(112px,120px)_minmax(88px,96px)_minmax(100px,120px)] items-center gap-x-3 gap-y-2 border-b border-[#ebebeb] px-4 py-3 last:border-b-0"
                >
                  <span className="min-w-0 truncate text-left text-sm text-[#333]">{item.name}</span>
                  <div className="flex justify-center">
                    <InventoryStatusBadge status={status} />
                  </div>
                  <span className="text-right text-sm tabular-nums text-[#333]">
                    {item.quantity} {item.unit}
                  </span>
                  <div className="flex w-full justify-end">
                    <InventoryUpdateStockDialog
                      id={item.id}
                      name={item.name}
                      unit={item.unit}
                      quantity={item.quantity}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {totalFiltered > 0 ? (
        <div className="mt-4">
          <InventoryPagination
            page={page}
            pageSize={pageSize}
            total={totalFiltered}
            hrefForPage={hrefForPage}
          />
        </div>
      ) : null}
    </div>
  );
}
