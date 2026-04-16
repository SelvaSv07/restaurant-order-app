"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleMinus, CirclePlus, Plus, Search, Trash2 } from "lucide-react";

import {
  addLineAction,
  adjustLineQtyAction,
  removeLineAction,
} from "@/app/(app)/billing/line-actions";
import { CategoryPill } from "@/components/billing/category-pill";
import { ProductImage } from "@/components/billing/product-image";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { billLines, categories, products } from "@/lib/db/schema";
import { billingHref } from "@/lib/billing-href";
import { formatINR } from "@/lib/money";

type Product = typeof products.$inferSelect;
type Category = typeof categories.$inferSelect;
type BillLineRow = typeof billLines.$inferSelect & {
  imageLocalPath: string | null;
  categoryIconKey: string;
  categoryColorHex: string;
};

export function BillingMenuSection({
  categoryFilteredProducts,
  allCategories,
  categoryId,
  rawCat,
  initialQ,
  billId,
  lines,
}: {
  categoryFilteredProducts: Product[];
  allCategories: Category[];
  categoryId: number | null;
  rawCat: string;
  initialQ: string;
  billId: number;
  lines: BillLineRow[];
}) {
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  const lineByProductId = useMemo(
    () => new Map(lines.map((l) => [l.productId, l])),
    [lines],
  );

  const catById = useMemo(() => new Map(allCategories.map((c) => [c.id, c])), [allCategories]);

  const qLower = q.trim().toLowerCase();
  const filteredProducts = useMemo(() => {
    if (!qLower) return categoryFilteredProducts;
    return categoryFilteredProducts.filter((p) => p.name.toLowerCase().includes(qLower));
  }, [categoryFilteredProducts, qLower]);

  const qForLinks = q.trim() || undefined;

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:h-full lg:min-h-0">
      <div className="flex shrink-0 flex-col gap-5 pr-2">
        <div className="w-full">
          <label className="flex w-full min-w-0 items-center gap-2 rounded-full border border-[#d6d6d6] bg-white px-4 py-2.5 shadow-sm">
            <Search className="size-4 shrink-0 text-[#7a7a7a]" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products…"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#454545] outline-none placeholder:text-[#b0b0b0]"
            />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <CategoryPill
            href={billingHref({ category: "all", q: qForLinks })}
            active={categoryId === null}
            label="All"
            iconKey="LayoutGrid"
            iconColor="#7a7a7a"
          />
          {allCategories.map((c) => (
            <CategoryPill
              key={c.id}
              href={billingHref({ category: String(c.id), q: qForLinks })}
              active={categoryId === c.id}
              label={c.name}
              iconKey={c.iconKey}
              iconColor={c.colorHex}
            />
          ))}
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 overflow-hidden pr-1 lg:min-h-0">
        <div className="flex flex-col gap-5 pr-2 pt-5">
      <div className="grid w-full justify-start gap-5 [grid-template-columns:repeat(auto-fill,249px)]">
        {filteredProducts.map((product) => {
          const cat = catById.get(product.categoryId);
          const line = lineByProductId.get(product.id);
          const iconKey = cat?.iconKey ?? "Utensils";
          const iconColor = cat?.colorHex ?? "#f97316";

          return (
            <div
              key={product.id}
              className="flex h-[242px] w-[249px] max-w-full flex-col overflow-hidden rounded-[15px] bg-white shadow-sm ring-1 ring-black/[0.04]"
            >
              <div className="relative h-[144px] w-full shrink-0 overflow-hidden rounded-t-[15px] bg-[#d9d9d9]">
                <ProductImage
                  src={product.imageLocalPath ?? null}
                  alt={product.name}
                  iconKey={iconKey}
                  iconColor={iconColor}
                  className="h-full w-full"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="line-clamp-2 min-w-0 text-[16px] font-semibold leading-tight text-[#454545]">
                    {product.name}
                  </p>
                  <p className="shrink-0 text-[16px] font-semibold leading-tight text-[#f97316]">
                    {formatINR(product.priceRupee)}
                  </p>
                </div>
                {line ? (
                  <div className="mt-auto flex items-center justify-between gap-1.5 pt-2">
                    <div className="flex items-center gap-1.5">
                      <form action={adjustLineQtyAction}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="delta" value={-1} />
                        <button
                          type="submit"
                          className="flex cursor-pointer text-[#f97316] transition-opacity hover:opacity-80"
                          aria-label="Decrease quantity"
                        >
                          <CircleMinus className="size-6" strokeWidth={1.5} />
                        </button>
                      </form>
                      <span className="flex h-7 min-w-[48px] items-center justify-center rounded-full border border-[#d6d6d6] bg-transparent px-2 text-sm font-semibold text-[#454545]">
                        {line.qty}
                      </span>
                      <form action={adjustLineQtyAction}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <input type="hidden" name="delta" value={1} />
                        <button
                          type="submit"
                          className="flex cursor-pointer text-[#f97316] transition-opacity hover:opacity-80"
                          aria-label="Increase quantity"
                        >
                          <CirclePlus className="size-6" strokeWidth={1.5} />
                        </button>
                      </form>
                    </div>
                    <form action={removeLineAction}>
                      <input type="hidden" name="lineId" value={line.id} />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-full p-1 text-[#ef4444] transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Remove from cart"
                      >
                        <Trash2 className="size-5" />
                      </button>
                    </form>
                  </div>
                ) : (
                  <form action={addLineAction} className="mt-auto w-full pt-2">
                    <input type="hidden" name="billId" value={billId} />
                    <input type="hidden" name="productId" value={product.id} />
                    <input type="hidden" name="qty" value={1} />
                    <Button
                      type="submit"
                      className="mx-auto flex h-auto w-[217px] max-w-full items-center justify-center gap-1.5 rounded-full border-0 bg-[#f97316] px-4 py-1 text-[12px] font-semibold text-white hover:bg-[#ea580c]"
                    >
                      <Plus className="size-3.5" aria-hidden />
                      Add
                    </Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {filteredProducts.length === 0 ? (
        <p className="text-sm font-medium text-[#7a7a7a]">No products match your filters.</p>
      ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}
