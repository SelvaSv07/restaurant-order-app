"use client";

import { splitStockBars } from "@/lib/inventory";

const BAR_COLORS = {
  in: "bg-[#ff6b1e]",
  low: "bg-[#fdcea1]",
  out: "bg-[#333]",
  muted: "bg-[#ebebeb]",
} as const;

export function InventoryStockLevelCard({
  totalProducts,
  inCount,
  lowCount,
  outCount,
}: {
  totalProducts: number;
  inCount: number;
  lowCount: number;
  outCount: number;
}) {
  const bars = splitStockBars(inCount, lowCount, outCount);

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base font-semibold text-[#333]">Stock Level</p>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-[10px] px-0.5 py-2 text-xs font-medium text-[#333]"
        >
          This Month
          <span className="inline-flex size-[14px] items-center justify-center" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3.5 5.25L7 8.75L10.5 5.25"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-5 pb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[32px] font-semibold leading-tight text-[#333]">
            {totalProducts.toLocaleString("en-IN")}
          </span>
          <span className="text-sm text-[#858585]">Products</span>
        </div>

        <div className="flex h-12 w-full gap-1">
          {bars.map((b, i) => (
            <div key={i} className={`min-w-px flex-1 rounded ${BAR_COLORS[b]}`} />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-[#f7f7f7] pt-4">
          <StockLegend color="bg-[#ff6b1e]" label="In Stock" value={inCount} />
          <StockLegend color="bg-[#fdcea1]" label="Low Stock" value={lowCount} />
          <StockLegend color="bg-[#333]" label="Out of Stock" value={outCount} />
        </div>
      </div>
    </div>
  );
}

function StockLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex gap-2">
      <div className={`mt-0.5 size-2 shrink-0 rounded-sm ${color}`} />
      <div className="min-w-0 space-y-1">
        <p className="text-xs text-[#858585]">{label}</p>
        <p className="text-lg font-semibold leading-tight text-[#333]">
          {value.toLocaleString("en-IN")}{" "}
          <span className="text-xs font-normal text-[#858585]">Products</span>
        </p>
      </div>
    </div>
  );
}
