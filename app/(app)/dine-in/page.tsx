import Link from "next/link";
import { Suspense } from "react";
import { ProductMenuCard } from "@/components/billing/product-menu-card";
import { CategoryLucideIcon } from "@/components/category-lucide-icon";
import { DineInCheckoutFlow, DineInPaymentDetailsCard } from "@/components/app/dine-in-checkout-flow";
import { DineInOrderSidebar } from "@/components/app/dine-in-order-sidebar";
import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { DineInProductSearch } from "@/components/app/dine-in-product-search";
import { DineInOrderScrollArea } from "@/components/app/dine-in-order-scroll-area";
import { getBillWithLines, getCategoriesWithProducts, getOpenTableBill, getTables } from "@/lib/repository";
import { cn } from "@/lib/utils";

function dineInHref(opts: { tableId: number; category?: string; q?: string }) {
  const sp = new URLSearchParams();
  sp.set("tableId", String(opts.tableId));
  if (opts.category && opts.category !== "all") sp.set("category", opts.category);
  if (opts.q) sp.set("q", opts.q);
  return `/dine-in?${sp.toString()}`;
}

type PageProps = {
  searchParams: Promise<{ tableId?: string; category?: string; q?: string }>;
};

export default async function DineInPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const rawCat = sp.category ?? "all";
  const categoryId =
    rawCat === "all" || rawCat === "" ? null : Number.isFinite(Number(rawCat)) ? Number(rawCat) : null;

  const tables = await getTables();
  const requested = sp.tableId ? Number(sp.tableId) : NaN;
  const selectedTableId =
    tables.length === 0
      ? 0
      : Number.isFinite(requested) && tables.some((t) => t.id === requested)
        ? requested
        : tables[0]!.id;

  const { allCategories, allProducts } = await getCategoriesWithProducts();
  const catById = new Map(allCategories.map((c) => [c.id, c]));

  const filteredProducts = allProducts.filter((p) => {
    if (!p.active) return false;
    if (categoryId !== null && p.categoryId !== categoryId) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  if (tables.length === 0) {
    return (
      <div className="mx-auto flex w-full min-w-0 max-w-[min(100%,1760px)] flex-1 flex-col gap-6">
        <div className="rounded-[15px] border border-dashed border-[#d6d6d6] bg-white p-10 text-center shadow-sm ring-1 ring-black/[0.04]">
          <p className="text-sm font-medium text-[#7a7a7a]">No tables configured yet.</p>
          <Link
            href="/settings/tables"
            className={cn(
              buttonVariants(),
              "mt-4 rounded-full border-0 bg-[#f97316] hover:bg-[#ea580c]",
            )}
          >
            Open table settings
          </Link>
        </div>
      </div>
    );
  }

  const bill = await getOpenTableBill(selectedTableId);
  const billData = await getBillWithLines(bill.id);
  const lineByProductId = new Map(billData.lines.map((l) => [l.productId, l]));
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[min(100%,1760px)] flex-1 flex-col lg:min-h-0 lg:h-[calc(100dvh-1.5rem)] sm:lg:h-[calc(100dvh-2rem)] lg:overflow-hidden">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 lg:h-full lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
          <div className="flex shrink-0 flex-col gap-6 pr-2">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="w-full text-xs font-semibold uppercase tracking-wide text-[#7a7a7a] sm:mr-1 sm:w-auto">
                Table
              </span>
              {tables.map((table) => (
                <Link
                  key={table.id}
                  href={dineInHref({ tableId: table.id, category: rawCat, q: sp.q })}
                  className={cn(
                    "inline-flex cursor-pointer items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors sm:px-6 sm:text-base",
                    selectedTableId === table.id
                      ? "bg-[#f97316] text-white shadow-sm"
                      : "bg-white text-[#7a7a7a] shadow-sm ring-1 ring-black/[0.06] hover:bg-white/90",
                  )}
                >
                  {table.name}
                </Link>
              ))}
            </div>

            <div className="flex min-w-0 flex-col gap-5">
              <Suspense
                fallback={
                  <div className="h-[46px] w-full animate-pulse rounded-full bg-[#f0f0f0]" aria-hidden />
                }
              >
                <DineInProductSearch tableId={selectedTableId} categoryRaw={rawCat} />
              </Suspense>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <CategoryPill
                  href={dineInHref({ tableId: selectedTableId, category: "all", q: sp.q })}
                  active={categoryId === null}
                  label="All"
                  iconKey="LayoutGrid"
                  iconColor="#7a7a7a"
                />
                {allCategories.map((c) => (
                  <CategoryPill
                    key={c.id}
                    href={dineInHref({ tableId: selectedTableId, category: String(c.id), q: sp.q })}
                    active={categoryId === c.id}
                    label={c.name}
                    iconKey={c.iconKey}
                    iconColor={c.colorHex}
                  />
                ))}
              </div>
            </div>
          </div>

          <ScrollArea className="min-h-0 flex-1 overflow-hidden pr-1 lg:min-h-0">
            <div className="flex flex-col gap-5 pr-2 pt-5">
          <div className="grid w-full justify-start gap-5 [grid-template-columns:repeat(auto-fill,249px)]">
            {filteredProducts.map((product) => {
              const cat = catById.get(product.categoryId);
              const line = lineByProductId.get(product.id);
              const newQty = line ? line.qty - line.qtyKotSent : 0;
              const iconKey = cat?.iconKey ?? "Utensils";
              const iconColor = cat?.colorHex ?? "#f97316";

              const showQtyControls = Boolean(line && newQty > 0);

              return (
                <ProductMenuCard
                  key={product.id}
                  mode="dine-in"
                  product={product}
                  categoryIconKey={iconKey}
                  categoryColorHex={iconColor}
                  billId={bill.id}
                  line={line}
                  newQty={newQty}
                  showQtyControls={showQtyControls}
                />
              );
            })}
          </div>
          {filteredProducts.length === 0 ? (
            <p className="text-sm font-medium text-[#7a7a7a]">No products match your filters.</p>
          ) : null}
            </div>
          </ScrollArea>
        </div>

        <aside className="flex min-h-0 w-full min-w-0 flex-col rounded-[15px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] lg:h-full lg:max-h-full lg:w-[360px] lg:max-w-[360px] lg:shrink-0 lg:overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#454545]">Current order</h2>
            {selectedTable ? (
              <span className="inline-flex max-w-[55%] shrink-0 items-center truncate rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-0.5 text-xs font-semibold text-[#454545]">
                {selectedTable.name}
              </span>
            ) : null}
          </div>
          <DineInOrderScrollArea>
            <DineInOrderSidebar lines={billData.lines} />
          </DineInOrderScrollArea>

          <div className="shrink-0">
            <DineInCheckoutFlow
              billId={bill.id}
              hasLines={billData.lines.length > 0}
              hasUnsentLines={billData.lines.some((l) => l.qty > l.qtyKotSent)}
              key={bill.id}
            >
              <DineInPaymentDetailsCard
                billId={bill.id}
                subtotalRupee={billData.bill.subtotalRupee}
                discountRupee={billData.bill.discountRupee}
                totalRupee={billData.bill.totalRupee}
                discountType={billData.bill.discountType}
                discountValue={billData.bill.discountValue}
                placeOrderDisabled={billData.lines.length === 0}
              />
            </DineInCheckoutFlow>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CategoryPill({
  href,
  active,
  label,
  iconKey,
  iconColor,
}: {
  href: string;
  active: boolean;
  label: string;
  iconKey: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors sm:px-6 sm:text-base",
        active ? "bg-[#f97316] text-white shadow-sm" : "bg-white text-[#7a7a7a] shadow-sm ring-1 ring-black/[0.06] hover:bg-white/90",
      )}
    >
      <CategoryLucideIcon
        name={iconKey}
        color={active ? "#ffffff" : iconColor}
        className="size-4 shrink-0"
      />
      {label}
    </Link>
  );
}
