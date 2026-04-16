import { Suspense } from "react";

import { InventoryProductsTable } from "@/components/app/inventory-products-table";
import { InventoryStockLevelCard } from "@/components/app/inventory-stock-level-card";
import { InventoryToolbar } from "@/components/app/inventory-toolbar";
import { getInventoryStatus } from "@/lib/inventory";
import { getInventory } from "@/lib/repository";

type Search = {
  q?: string;
  status?: string;
  page?: string;
};

const PAGE_SIZE = 10;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const allItems = await getInventory();

  let inCount = 0;
  let lowCount = 0;
  let outCount = 0;
  for (const item of allItems) {
    const st = getInventoryStatus(item);
    if (st === "available") inCount++;
    else if (st === "low") lowCount++;
    else outCount++;
  }

  let filtered = allItems;
  if (q) filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
  if (status !== "all") {
    filtered = filtered.filter((i) => getInventoryStatus(i) === status);
  }

  const totalFiltered = filtered.length;
  const pageCount = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const sliceStart = (safePage - 1) * PAGE_SIZE;
  const paged = filtered.slice(sliceStart, sliceStart + PAGE_SIZE);

  function hrefForPage(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", params.q ?? "");
    if (status !== "all") sp.set("status", status);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/inventory?${s}` : "/inventory";
  }

  return (
    <div className="space-y-6">
      <InventoryStockLevelCard
        totalProducts={allItems.length}
        inCount={inCount}
        lowCount={lowCount}
        outCount={outCount}
      />

      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
        <Suspense fallback={<div className="h-14 rounded-xl bg-white/60" />}>
          <InventoryToolbar />
        </Suspense>
        <div className="mt-4">
          <InventoryProductsTable
            rows={paged}
            page={safePage}
            pageSize={PAGE_SIZE}
            totalFiltered={totalFiltered}
            hrefForPage={hrefForPage}
          />
        </div>
      </div>
    </div>
  );
}
