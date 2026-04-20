import { BillingDiscountControl } from "@/components/billing/billing-discount";
import { BillingMenuSection } from "@/components/billing/billing-menu-section";
import { BillingOrderSidebar } from "@/components/billing/billing-order-sidebar";
import { CompleteBillForm } from "@/components/billing/complete-bill-form";
import { DineInOrderScrollArea } from "@/components/app/dine-in-order-scroll-area";
import { formatINR, shouldHideDraftZeroAmount } from "@/lib/money";
import {
  getBillWithLines,
  getCategoriesWithProducts,
  getOpenTakeawayBill,
} from "@/lib/repository";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export default async function BillingPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const rawCat = sp.category ?? "all";
  const categoryId =
    rawCat === "all" || rawCat === "" ? null : Number.isFinite(Number(rawCat)) ? Number(rawCat) : null;

  const bill = await getOpenTakeawayBill();
  const billData = await getBillWithLines(bill.id);
  const { allCategories, allProducts } = await getCategoriesWithProducts();

  const categoryFilteredProducts = allProducts.filter((p) => {
    if (!p.active) return false;
    if (categoryId !== null && p.categoryId !== categoryId) return false;
    return true;
  });

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[min(100%,1760px)] flex-1 flex-col lg:min-h-0 lg:h-[calc(100dvh-1.5rem)] sm:lg:h-[calc(100dvh-2rem)] lg:overflow-hidden">
      <div className="flex min-h-0 w-full flex-1 flex-col gap-6 lg:h-full lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden">
        <div className="min-h-0 min-w-0 flex-1 lg:h-full lg:min-h-0">
          <BillingMenuSection
            categoryFilteredProducts={categoryFilteredProducts}
            allCategories={allCategories}
            categoryId={categoryId}
            initialQ={sp.q ?? ""}
            billId={bill.id}
            lines={billData.lines}
          />
        </div>

        <aside className="flex min-h-0 w-full min-w-0 flex-col rounded-[15px] bg-white p-4 shadow-sm ring-1 ring-black/[0.04] max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] lg:h-full lg:max-h-full lg:w-[360px] lg:max-w-[360px] lg:shrink-0 lg:overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#454545]">Current order</h2>
            <span className="inline-flex max-w-[55%] shrink-0 items-center truncate rounded-full border border-[#e8e8e8] bg-[#fafafa] px-2.5 py-0.5 text-xs font-semibold text-[#454545]">
              Takeaway
            </span>
          </div>
          <DineInOrderScrollArea>
            <BillingOrderSidebar lines={billData.lines} />
          </DineInOrderScrollArea>

          <div className="mt-3 shrink-0 space-y-4 pt-0">
            <div className="rounded-[15px] border border-[#d6d6d6] p-4">
              <p className="text-base font-semibold text-[#454545]">Payment details</p>
              <dl className="mt-4 space-y-3 text-sm font-semibold text-[#454545]">
                <div className="flex justify-between gap-4">
                  <dt>Subtotal</dt>
                  <dd>
                    {shouldHideDraftZeroAmount(billData.bill.status, billData.bill.subtotalRupee) ? (
                      <span className="text-[#858585]">—</span>
                    ) : (
                      formatINR(billData.bill.subtotalRupee)
                    )}
                  </dd>
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
                  <dd className={shouldHideDraftZeroAmount(billData.bill.status, billData.bill.totalRupee) ? "text-[#858585]" : "text-[#f97316]"}>
                    {shouldHideDraftZeroAmount(billData.bill.status, billData.bill.totalRupee)
                      ? "—"
                      : formatINR(billData.bill.totalRupee)}
                  </dd>
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
