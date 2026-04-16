import { CirclePlus } from "lucide-react";

import { adjustDineInLineQtyAction } from "@/app/(app)/dine-in/actions";
import {
  DineInDecreaseSentWithConfirm,
  DineInDecreaseWithConfirm,
  DineInRemoveLineWithConfirm,
} from "@/components/app/dine-in-adjust-with-confirm";
import { ProductImage } from "@/components/billing/product-image";
import { formatINR } from "@/lib/money";

/** Shared order-line thumbnail (aligned across sent / new rows) */
const lineThumbClass =
  "relative size-[4.5rem] shrink-0 overflow-hidden rounded-xl ring-1 ring-black/[0.06] bg-[#f5f5f5]";

type SidebarLine = {
  id: number;
  productNameSnapshot: string;
  unitPriceRupeeSnapshot: number;
  qty: number;
  qtyKotSent: number;
  imageLocalPath: string | null;
  categoryIconKey: string;
  categoryColorHex: string;
};

export function DineInOrderSidebar({ lines }: { lines: SidebarLine[] }) {
  if (lines.length === 0) {
    return (
      <p className="text-sm font-medium text-[#7a7a7a]">No items yet — add from the menu.</p>
    );
  }

  const processed = lines.filter((l) => l.qtyKotSent > 0);
  const newItems = lines.filter((l) => l.qty > l.qtyKotSent);

  return (
    <div className="flex flex-col gap-5">
      {processed.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#7a7a7a]">
            Sent to kitchen
          </p>
          <div className="flex flex-col gap-3">
            {processed.map((line) => (
              <DineInLineReadOnly
                key={`${line.id}-sent`}
                line={line}
                displayQty={line.qtyKotSent}
                badge="Sent"
              />
            ))}
          </div>
        </div>
      ) : null}

      {newItems.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[#f97316]">New items</p>
          <div className="flex flex-col gap-3">
            {newItems.map((line) => (
              <DineInLineEditable key={`${line.id}-new`} line={line} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DineInLineReadOnly({
  line,
  displayQty,
  badge,
}: {
  line: SidebarLine;
  displayQty: number;
  badge: string;
}) {
  return (
    <div className="flex gap-3 opacity-90">
      <div className={lineThumbClass}>
        <ProductImage
          src={line.imageLocalPath ?? null}
          alt={line.productNameSnapshot}
          iconKey={line.categoryIconKey}
          iconColor={line.categoryColorHex}
          className="h-full w-full"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 text-sm font-semibold leading-tight text-[#454545]">
            {line.productNameSnapshot}
          </p>
          <span className="mt-0.5 shrink-0 rounded-full bg-[#f3f4f6] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#7a7a7a]">
            {badge}
          </span>
        </div>
        <p className="text-sm font-semibold text-[#f97316]">{formatINR(line.unitPriceRupeeSnapshot)}</p>
        <div className="flex items-center gap-2">
          <DineInDecreaseSentWithConfirm lineId={line.id} qtyKotSent={line.qtyKotSent} iconSizeClass="size-[22px]" />
          <span className="flex h-7 min-w-[48px] items-center justify-center rounded-full border border-[#d6d6d6] bg-[#fafafa] px-3 text-sm font-semibold tabular-nums text-[#454545]">
            × {displayQty}
          </span>
        </div>
      </div>
    </div>
  );
}

function DineInLineEditable({ line }: { line: SidebarLine }) {
  const newQty = line.qty - line.qtyKotSent;

  return (
    <div className="flex gap-3">
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
            <p className="mt-0.5 text-sm font-semibold text-[#f97316]">{formatINR(line.unitPriceRupeeSnapshot)}</p>
          </div>
          <DineInRemoveLineWithConfirm
            lineId={line.id}
            qtyKotSent={line.qtyKotSent}
            className="-m-1 cursor-pointer rounded-md p-1.5 text-[#ef4444] transition-opacity hover:bg-red-50 hover:opacity-100"
          />
        </div>
        <div className="flex items-center gap-2">
          <DineInDecreaseWithConfirm lineId={line.id} qtyKotSent={line.qtyKotSent} iconSizeClass="size-[22px]" />
          <span className="flex h-7 min-w-[48px] items-center justify-center rounded-full border border-[#d6d6d6] bg-transparent px-3 text-sm font-semibold tabular-nums text-[#454545]">
            {newQty}
          </span>
          <form action={adjustDineInLineQtyAction}>
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
      </div>
    </div>
  );
}
