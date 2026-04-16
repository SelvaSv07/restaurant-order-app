import { revalidatePath } from "next/cache";
import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { CircleMinus, CirclePlus, Plus, Search, Trash2 } from "lucide-react";

import { BillingDiscountControl } from "@/components/billing/billing-discount";
import { CompleteBillForm } from "@/components/billing/complete-bill-form";
import { ProductImage } from "@/components/billing/product-image";
import { CategoryLucideIcon } from "@/components/category-lucide-icon";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { billLines, bills, products } from "@/lib/db/schema";
import { formatINR } from "@/lib/money";
import {
  getBillWithLines,
  getCategoriesWithProducts,
  getOpenTakeawayBill,
  recomputeBillTotals,
} from "@/lib/repository";
import { cn } from "@/lib/utils";

async function addLineAction(formData: FormData) {
  "use server";
  const billId = Number(formData.get("billId"));
  const productId = Number(formData.get("productId"));
  const qty = Number(formData.get("qty"));
  const [product] = await db.select().from(products).where(eq(products.id, productId));
  if (!product || qty <= 0) return;

  const [existing] = await db
    .select()
    .from(billLines)
    .where(and(eq(billLines.billId, billId), eq(billLines.productId, productId)));

  if (existing) {
    const nextQty = existing.qty + qty;
    await db
      .update(billLines)
      .set({ qty: nextQty, lineTotalRupee: nextQty * existing.unitPriceRupeeSnapshot })
      .where(eq(billLines.id, existing.id));
  } else {
    await db.insert(billLines).values({
      billId,
      productId,
      qty,
      productNameSnapshot: product.name,
      unitPriceRupeeSnapshot: product.priceRupee,
      includeInKotSnapshot: product.includeInKot,
      lineTotalRupee: qty * product.priceRupee,
    });
  }

  const [billRow] = await db.select().from(bills).where(eq(bills.id, billId));
  if (billRow) await recomputeBillTotals(billId, billRow.discountType, billRow.discountValue);
  revalidatePath("/billing");
}

async function adjustLineQtyAction(formData: FormData) {
  "use server";
  const lineId = Number(formData.get("lineId"));
  const delta = Number(formData.get("delta"));
  const [line] = await db.select().from(billLines).where(eq(billLines.id, lineId));
  if (!line || delta === 0) return;
  const [bill] = await db.select().from(bills).where(eq(bills.id, line.billId));
  if (!bill) return;

  const next = line.qty + delta;
  if (next <= 0) {
    await db.delete(billLines).where(eq(billLines.id, lineId));
  } else {
    await db
      .update(billLines)
      .set({
        qty: next,
        lineTotalRupee: next * line.unitPriceRupeeSnapshot,
      })
      .where(eq(billLines.id, lineId));
  }
  await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
  revalidatePath("/billing");
}

async function removeLineAction(formData: FormData) {
  "use server";
  const lineId = Number(formData.get("lineId"));
  const [line] = await db.select().from(billLines).where(eq(billLines.id, lineId));
  if (!line) return;
  const [bill] = await db.select().from(bills).where(eq(bills.id, line.billId));
  if (!bill) return;
  await db.delete(billLines).where(eq(billLines.id, lineId));
  await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
  revalidatePath("/billing");
}

function billingHref(opts: { category?: string; q?: string }) {
  const sp = new URLSearchParams();
  if (opts.category && opts.category !== "all") sp.set("category", opts.category);
  if (opts.q) sp.set("q", opts.q);
  const s = sp.toString();
  return s ? `/billing?${s}` : "/billing";
}

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function BillingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const rawCat = sp.category ?? "all";
  const categoryId =
    rawCat === "all" || rawCat === "" ? null : Number.isFinite(Number(rawCat)) ? Number(rawCat) : null;

  const bill = await getOpenTakeawayBill();
  const billData = await getBillWithLines(bill.id);
  const { allCategories, allProducts } = await getCategoriesWithProducts();

  const catById = new Map(allCategories.map((c) => [c.id, c]));
  const lineByProductId = new Map(billData.lines.map((l) => [l.productId, l]));

  const filteredProducts = allProducts.filter((p) => {
    if (!p.active) return false;
    if (categoryId !== null && p.categoryId !== categoryId) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[min(100%,1760px)] flex-1 flex-col">
      <div className="grid w-full flex-1 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-6">
        {/* Menu: search + categories + grid share one left edge */}
        <section className="flex min-w-0 flex-col gap-5">
          <form action="/billing" method="get" className="w-full">
            {rawCat && rawCat !== "all" ? <input type="hidden" name="category" value={rawCat} /> : null}
            <label className="flex w-full min-w-0 items-center gap-2 rounded-full border border-[#d6d6d6] bg-white px-4 py-2.5 shadow-sm">
              <Search className="size-4 shrink-0 text-[#7a7a7a]" />
              <input
                name="q"
                defaultValue={sp.q ?? ""}
                placeholder="Search products…"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#454545] outline-none placeholder:text-[#b0b0b0]"
              />
            </label>
          </form>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <CategoryPill
              href={billingHref({ category: "all", q: sp.q })}
              active={categoryId === null}
              label="All"
              iconKey="LayoutGrid"
              iconColor="#7a7a7a"
            />
            {allCategories.map((c) => (
              <CategoryPill
                key={c.id}
                href={billingHref({ category: String(c.id), q: sp.q })}
                active={categoryId === c.id}
                label={c.name}
                iconKey={c.iconKey}
                iconColor={c.colorHex}
              />
            ))}
          </div>

          {/* Figma: 249px columns, left-aligned (no centering in wide cells) */}
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
                        <input type="hidden" name="billId" value={bill.id} />
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
        </section>

        <aside className="flex w-full min-w-0 flex-col rounded-[15px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] lg:sticky lg:top-6 lg:self-start">
          <h2 className="text-base font-semibold text-[#454545]">Current Order</h2>
          <div className="mt-4 flex max-h-[min(420px,50vh)] flex-col gap-4 overflow-y-auto pr-1">
            {billData.lines.length === 0 ? (
              <p className="text-sm font-medium text-[#7a7a7a]">No items yet — add from the menu.</p>
            ) : (
              billData.lines.map((line, index) => (
                <div key={line.id}>
                  <div className="flex gap-3">
                    <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[15px] sm:size-[100px]">
                      <ProductImage
                        src={line.imageLocalPath ?? null}
                        alt={line.productNameSnapshot}
                        iconKey={line.categoryIconKey}
                        iconColor={line.categoryColorHex}
                        className="h-full w-full"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 items-end justify-between gap-2">
                      <div className="min-w-0 space-y-3">
                        <div>
                          <p className="text-base font-semibold text-[#454545]">{line.productNameSnapshot}</p>
                          <p className="text-base font-semibold text-[#f97316]">
                            {formatINR(line.unitPriceRupeeSnapshot)}
                          </p>
                        </div>
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
                          <span className="flex h-7 min-w-[48px] items-center justify-center rounded-full border border-[#d6d6d6] bg-transparent px-3 text-sm font-semibold text-[#454545]">
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
                      </div>
                      <form action={removeLineAction}>
                        <input type="hidden" name="lineId" value={line.id} />
                        <button
                          type="submit"
                          className="cursor-pointer rounded-full p-1 text-[#ef4444] transition-colors hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove line"
                        >
                          <Trash2 className="size-5" />
                        </button>
                      </form>
                    </div>
                  </div>
                  {index < billData.lines.length - 1 ? <div className="my-4 h-px bg-[#d6d6d6]" /> : null}
                </div>
              ))
            )}
          </div>

          <div className="mt-4 space-y-4 border-t border-[#d6d6d6] pt-4">
            <div className="rounded-[15px] border border-[#d6d6d6] p-4">
              <p className="text-base font-semibold text-[#454545]">Payment details</p>
              <dl className="mt-4 space-y-3 text-sm font-semibold text-[#454545]">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>{formatINR(billData.bill.subtotalRupee)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Taxes</dt>
                  <dd>{formatINR(0)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>Discount</dt>
                  <dd>{formatINR(billData.bill.discountRupee)}</dd>
                </div>
                <div className="h-px bg-[#d6d6d6]" />
                <div className="flex justify-between gap-4 text-base font-extrabold">
                  <dt>Total</dt>
                  <dd className="text-[#f97316]">{formatINR(billData.bill.totalRupee)}</dd>
                </div>
              </dl>

              <BillingDiscountControl
                key={`${billData.bill.discountType}-${billData.bill.discountValue}`}
                billId={bill.id}
                discountType={billData.bill.discountType}
                discountValue={billData.bill.discountValue}
              />

              <CompleteBillForm billId={bill.id} disabled={billData.lines.length === 0} />
            </div>
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
