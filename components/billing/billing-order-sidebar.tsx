import { CircleMinus, CirclePlus, Trash2 } from "lucide-react";

import { adjustLineQtyAction, removeLineAction } from "@/app/(app)/billing/line-actions";
import { ProductImage } from "@/components/billing/product-image";
import { formatINR } from "@/lib/money";
import { billLines } from "@/lib/db/schema";

const lineThumbClass =
  "relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/[0.06] bg-[#f5f5f5]";

type LineRow = typeof billLines.$inferSelect & {
  imageLocalPath: string | null;
  categoryIconKey: string;
  categoryColorHex: string;
};

export function BillingOrderSidebar({ lines }: { lines: LineRow[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm font-medium text-[#7a7a7a]">No items yet — add from the menu.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {lines.map((line) => (
        <div key={line.id} className="flex gap-3">
          <div className={lineThumbClass}>
            <ProductImage
              src={line.imageLocalPath ?? null}
              alt={line.productNameSnapshot}
              iconKey={line.categoryIconKey}
              iconColor={line.categoryColorHex}
              className="h-full w-full"
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-[#454545]">{line.productNameSnapshot}</p>
                <p className="mt-0.5 text-sm font-semibold text-[#f97316]">
                  {formatINR(line.unitPriceRupeeSnapshot)}
                </p>
              </div>
              <form action={removeLineAction} className="shrink-0">
                <input type="hidden" name="lineId" value={line.id} />
                <button
                  type="submit"
                  className="-m-1 cursor-pointer rounded-md p-1.5 text-[#ef4444] transition-opacity hover:bg-red-50 hover:opacity-100"
                  aria-label="Remove line"
                >
                  <Trash2 className="size-[18px]" strokeWidth={2} />
                </button>
              </form>
            </div>
            <div className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <form action={adjustLineQtyAction}>
                  <input type="hidden" name="lineId" value={line.id} />
                  <input type="hidden" name="delta" value={-1} />
                  <button
                    type="submit"
                    className="flex cursor-pointer text-[#f97316] transition-opacity hover:opacity-80"
                    aria-label="Decrease quantity"
                  >
                    <CircleMinus className="size-[22px]" strokeWidth={1.5} />
                  </button>
                </form>
                <span className="flex h-7 min-w-[48px] items-center justify-center rounded-full border border-[#d6d6d6] bg-transparent px-3 text-sm font-semibold tabular-nums text-[#454545]">
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
                    <CirclePlus className="size-[22px]" strokeWidth={1.5} />
                  </button>
                </form>
              </div>
              <p
                className="shrink-0 text-sm font-semibold tabular-nums text-[#f97316]"
                title="Line total"
              >
                {formatINR(line.lineTotalRupee)}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
