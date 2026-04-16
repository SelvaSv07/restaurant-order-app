import { Suspense } from "react";

import { InventoryPageHeader } from "@/components/app/inventory-page-header";
import { InventoryProductsTable } from "@/components/app/inventory-products-table";
import { InventoryStockLevelCard } from "@/components/app/inventory-stock-level-card";
import { InventorySupplyOverview } from "@/components/app/inventory-supply-overview";
import { InventoryToolbar } from "@/components/app/inventory-toolbar";
import { buildSupplyOverviewSeries, getInventoryStatus } from "@/lib/inventory";
import { getInventory } from "@/lib/repository";

type Search = {
  tab?: string;
  q?: string;
  category?: string;
  status?: string;
  page?: string;
};

const PAGE_SIZE = 10;

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const tab = params.tab === "purchase" ? "purchase" : "inventory";
  const q = (params.q ?? "").trim().toLowerCase();
  const category = params.category ?? "all";
  const status = params.status ?? "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const allItems = await getInventory();
  const categories = [...new Set(allItems.map((i) => i.category))].sort((a, b) => a.localeCompare(b));

  const totalUnits = allItems.reduce((s, i) => s + i.quantity, 0);
  const supplySeries = buildSupplyOverviewSeries(totalUnits);

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
  if (category !== "all") filtered = filtered.filter((i) => i.category === category);
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
    if (params.tab === "purchase") sp.set("tab", "purchase");
    if (q) sp.set("q", params.q ?? "");
    if (category !== "all") sp.set("category", category);
    if (status !== "all") sp.set("status", status);
    if (p > 1) sp.set("page", String(p));
    const s = sp.toString();
    return s ? `/inventory?${s}` : "/inventory";
  }

  return (
    <div className="space-y-6">
      <InventoryPageHeader />

      {tab === "purchase" ? (
        <div className="space-y-6">
          <Suspense fallback={<div className="h-14 rounded-xl bg-white/60" />}>
            <InventoryToolbar categories={categories} />
          </Suspense>
          <div className="rounded-xl border border-[#ebebeb] bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-[#333]">Purchase orders</p>
            <p className="mt-2 text-sm text-[#858585]">This section will list purchase orders when connected.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <InventorySupplyOverview totalUnits={totalUnits} series={supplySeries} />
            <InventoryStockLevelCard
              totalProducts={allItems.length}
              inCount={inCount}
              lowCount={lowCount}
              outCount={outCount}
            />
          </div>

          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
            <Suspense fallback={<div className="h-14 rounded-xl bg-white/60" />}>
              <InventoryToolbar categories={categories} />
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
        </>
      )}
    </div>
  );
}
