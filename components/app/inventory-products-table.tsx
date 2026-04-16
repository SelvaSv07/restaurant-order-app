import { ArrowUpDown } from "lucide-react";
import type { InferSelectModel } from "drizzle-orm";

import { InventoryPagination } from "@/components/app/inventory-pagination";
import { InventoryReorderButton } from "@/components/app/inventory-reorder-button";
import { InventoryStatusBadge } from "@/components/app/inventory-status-badge";
import { UpdateInventoryStockDialog } from "@/components/app/update-inventory-stock-dialog";
import { inventoryItems } from "@/lib/db/schema";
import { getInventoryStatus, stockFillPercent } from "@/lib/inventory";

type Row = InferSelectModel<typeof inventoryItems>;

function SortLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-normal text-[#858585]">
      {children}
      <ArrowUpDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
    </span>
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
        <div className="min-w-[880px]">
          <div className="grid grid-cols-[28px_1fr_140px_108px_128px_96px_168px] items-center gap-3 border-b border-[#ebebeb] px-4 py-3.5">
            <span className="inline-flex size-3 rounded border border-[#dedede] bg-white" aria-hidden />
            <SortLabel>Item</SortLabel>
            <SortLabel>Category</SortLabel>
            <SortLabel>Status</SortLabel>
            <SortLabel>Qty in Stock</SortLabel>
            <SortLabel>Qty in Reorder</SortLabel>
            <SortLabel>Action</SortLabel>
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-12 text-center text-sm text-[#858585]">No items match your filters.</p>
          ) : (
            rows.map((item) => {
              const status = getInventoryStatus(item);
              const pct = stockFillPercent(item);
              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[28px_1fr_140px_108px_128px_96px_168px] items-center gap-3 border-b border-[#ebebeb] px-4 py-3 last:border-b-0"
                >
                  <input
                    type="checkbox"
                    className="size-3 rounded border-[#dedede] accent-[#ff6b1e]"
                    aria-label={`Select ${item.name}`}
                  />
                  <div className="flex min-w-0 items-center gap-2">
                    <div
                      className="size-9 shrink-0 rounded-lg bg-[#f7f7f7] ring-1 ring-inset ring-[#dedede]"
                      aria-hidden
                    />
                    <span className="truncate text-sm text-[#333]">{item.name}</span>
                  </div>
                  <span className="truncate text-sm text-[#333]">{item.category}</span>
                  <div className="flex min-w-0">
                    <InventoryStatusBadge status={status} />
                  </div>
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="h-[5px] min-w-0 flex-1 overflow-hidden rounded bg-[#ebebeb]">
                      <div
                        className="h-full rounded bg-[#ff6b1e]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-7 shrink-0 text-right text-sm tabular-nums text-[#333]">
                      {item.quantity}
                    </span>
                  </div>
                  <span className="text-center text-sm tabular-nums text-[#333]">{item.reorderQty}</span>
                  <div className="flex flex-wrap gap-1">
                    <InventoryReorderButton itemName={item.name} />
                    <UpdateInventoryStockDialog
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
