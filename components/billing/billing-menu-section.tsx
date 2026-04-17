"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { CategoryPill } from "@/components/billing/category-pill";
import { ProductMenuCard } from "@/components/billing/product-menu-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { billLines, categories, products } from "@/lib/db/schema";
import { billingHref } from "@/lib/billing-href";

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
                <ProductMenuCard
                  key={product.id}
                  mode="billing"
                  product={product}
                  categoryIconKey={iconKey}
                  categoryColorHex={iconColor}
                  billId={billId}
                  line={line}
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
  );
}
