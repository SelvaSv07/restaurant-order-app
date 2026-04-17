"use client";

import { CircleMinus, CirclePlus, Minus, Plus, Trash2 } from "lucide-react";

import {
  addLineAction,
  adjustLineQtyAction,
  removeLineAction,
} from "@/app/(app)/billing/line-actions";
import { addDineInLineAction, adjustDineInLineQtyAction } from "@/app/(app)/dine-in/actions";
import { DineInDecreaseWithConfirm, DineInRemoveLineWithConfirm } from "@/components/app/dine-in-adjust-with-confirm";
import { ProductImage } from "@/components/billing/product-image";
import { Button } from "@/components/ui/button";
import { billLines, products } from "@/lib/db/schema";
import { formatINR } from "@/lib/money";
import { cn } from "@/lib/utils";

type Product = typeof products.$inferSelect;
type BillLineRow = typeof billLines.$inferSelect & {
  imageLocalPath: string | null;
  categoryIconKey: string;
  categoryColorHex: string;
};

type BillingProps = {
  mode: "billing";
  product: Product;
  categoryIconKey: string;
  categoryColorHex: string;
  billId: number;
  line?: BillLineRow;
};

type DineInProps = {
  mode: "dine-in";
  product: Product;
  categoryIconKey: string;
  categoryColorHex: string;
  billId: number;
  line?: BillLineRow;
  newQty: number;
  showQtyControls: boolean;
};

export type ProductMenuCardProps = BillingProps | DineInProps;

/** Dark “wings” on left/right, nearly clear oval in the middle (matches hand-drawn mockup). */
const imageHoverVignetteStyle = {
  background:
    "linear-gradient(90deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.72) 14%, rgba(0,0,0,0.22) 32%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.22) 68%, rgba(0,0,0,0.72) 86%, rgba(0,0,0,0.9) 100%)",
} as const;

export function ProductMenuCard(props: ProductMenuCardProps) {
  const { product, categoryIconKey, categoryColorHex, billId } = props;
  const line = props.line;

  const showQtyOnImage =
    props.mode === "billing" ? Boolean(line) : props.showQtyControls;

  return (
    <div className="relative flex w-[249px] max-w-full flex-col overflow-hidden rounded-[15px] bg-white shadow-sm ring-1 ring-black/[0.04]">
      <div className="group relative h-[144px] w-full shrink-0 cursor-default overflow-hidden rounded-t-[15px] bg-[#d9d9d9]">
        <div className="h-full w-full origin-center transition-transform duration-300 ease-out will-change-transform group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          <ProductImage
            src={product.imageLocalPath ?? null}
            alt={product.name}
            iconKey={categoryIconKey}
            iconColor={categoryColorHex}
            className="h-full w-full"
          />
        </div>

        {/* Hover / focus-within: vignette + actions */}
        <div
          className={cn(
            "absolute inset-0 z-10 flex flex-col justify-center",
            "pointer-events-none opacity-0 transition-opacity duration-200 ease-out",
            "group-hover:pointer-events-auto group-hover:opacity-100",
          )}
        >
          <div className="pointer-events-none absolute inset-0" style={imageHoverVignetteStyle} aria-hidden />
          <div
            className={cn(
              "relative z-10 flex h-full w-full flex-col items-center justify-center",
              showQtyOnImage && "px-3",
            )}
          >
            {showQtyOnImage ? (
              <>
                {props.mode === "billing" && line ? (
                  <form action={removeLineAction} className="absolute right-2 top-2 z-40">
                    <input type="hidden" name="lineId" value={line.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-full bg-white/90 p-1.5 text-red-500 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                      aria-label="Remove from cart"
                    >
                      <Trash2 className="size-4" strokeWidth={2} />
                    </button>
                  </form>
                ) : null}
                {props.mode === "dine-in" && line && props.showQtyControls ? (
                  <div className="absolute right-2 top-2 z-40">
                    <DineInRemoveLineWithConfirm
                      lineId={line.id}
                      qtyKotSent={line.qtyKotSent}
                      className="cursor-pointer rounded-full bg-white/90 p-1.5 text-red-500 shadow-sm transition-colors hover:bg-white hover:text-red-600"
                      trashIconClassName="size-4 text-red-500"
                      aria-label="Remove from cart"
                    />
                  </div>
                ) : null}

                {props.mode === "billing" && line ? (
                  <div className="relative h-full w-full">
                    <form
                      action={adjustLineQtyAction}
                      className="absolute inset-y-0 left-0 z-20 w-[45%]"
                    >
                      <input type="hidden" name="lineId" value={line.id} />
                      <input type="hidden" name="delta" value={-1} />
                      <button
                        type="submit"
                        className="flex h-full w-full cursor-pointer items-center justify-start bg-transparent pl-2 transition-colors hover:bg-black/12 active:bg-black/20 sm:pl-3"
                        aria-label="Decrease quantity"
                      >
                        <Minus
                          className="size-12 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                          strokeWidth={3.25}
                        />
                      </button>
                    </form>
                    <div className="pointer-events-none absolute inset-y-0 left-[45%] z-30 flex w-[10%] items-center justify-center">
                      <span className="text-center text-5xl font-extrabold leading-none tabular-nums text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] sm:text-6xl">
                        {line.qty}
                      </span>
                    </div>
                    <form
                      action={adjustLineQtyAction}
                      className="absolute inset-y-0 right-0 z-20 w-[45%]"
                    >
                      <input type="hidden" name="lineId" value={line.id} />
                      <input type="hidden" name="delta" value={1} />
                      <button
                        type="submit"
                        className="flex h-full w-full cursor-pointer items-center justify-end bg-transparent pr-2 transition-colors hover:bg-black/12 active:bg-black/20 sm:pr-3"
                        aria-label="Increase quantity"
                      >
                        <Plus
                          className="size-12 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                          strokeWidth={3.25}
                        />
                      </button>
                    </form>
                  </div>
                ) : null}

                {props.mode === "dine-in" && props.showQtyControls && line ? (
                  <div className="relative h-full w-full">
                    <div className="absolute inset-y-0 left-0 z-20 w-[45%]">
                      <DineInDecreaseWithConfirm
                        lineId={line.id}
                        qtyKotSent={line.qtyKotSent}
                        plainMinus
                        minusStrokeWidth={3.25}
                        className="flex h-full w-full cursor-pointer items-center justify-start rounded-none border-0 bg-transparent pl-2 text-white transition-colors hover:bg-black/12 active:bg-black/20 disabled:opacity-50 sm:pl-3"
                        iconSizeClass="size-12 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                        aria-label="Decrease quantity"
                      />
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 left-[45%] z-30 flex w-[10%] items-center justify-center">
                      <span className="text-center text-5xl font-extrabold leading-none tabular-nums text-white drop-shadow-[0_2px_14px_rgba(0,0,0,0.9)] sm:text-6xl">
                        {props.newQty}
                      </span>
                    </div>
                    <form
                      action={adjustDineInLineQtyAction}
                      className="absolute inset-y-0 right-0 z-20 w-[45%]"
                    >
                      <input type="hidden" name="lineId" value={line.id} />
                      <input type="hidden" name="delta" value={1} />
                      <button
                        type="submit"
                        className="flex h-full w-full cursor-pointer items-center justify-end bg-transparent pr-2 transition-colors hover:bg-black/12 active:bg-black/20 sm:pr-3"
                        aria-label="Increase quantity"
                      >
                        <Plus
                          className="size-12 text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.95)]"
                          strokeWidth={3.25}
                        />
                      </button>
                    </form>
                  </div>
                ) : null}
              </>
            ) : (
              <form
                action={props.mode === "billing" ? addLineAction : addDineInLineAction}
                className="absolute inset-0 flex items-center justify-center"
              >
                <input type="hidden" name="billId" value={billId} />
                <input type="hidden" name="productId" value={product.id} />
                <input type="hidden" name="qty" value={1} />
                <button
                  type="submit"
                  className="flex h-full w-full cursor-pointer items-center justify-center rounded-none bg-transparent text-xl font-semibold tracking-[0.12em] text-white drop-shadow-md transition hover:scale-[1.03] motion-reduce:hover:scale-100"
                  aria-label={`Add ${product.name}`}
                >
                  Add
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-4 pb-3 pt-2.5">
        <div className="flex items-start justify-between gap-2">
          <p className="line-clamp-2 min-w-0 text-[15px] font-semibold leading-snug text-[#454545]">
            {product.name}
          </p>
          <p className="shrink-0 text-[15px] font-semibold leading-snug text-[#f97316]">
            {formatINR(product.priceRupee)}
          </p>
        </div>

        {props.mode === "billing" ? (
          line ? (
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
                className="mx-auto flex h-auto w-[217px] max-w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-[#f97316] px-4 py-1 text-[12px] font-semibold text-white hover:bg-[#ea580c]"
              >
                <Plus className="size-3.5" aria-hidden />
                Add
              </Button>
            </form>
          )
        ) : props.showQtyControls && line ? (
          <div className="mt-auto flex items-center justify-between gap-1.5 pt-2">
            <div className="flex items-center gap-1.5">
              <DineInDecreaseWithConfirm lineId={line.id} qtyKotSent={line.qtyKotSent} />
              <span className="flex h-7 min-w-[48px] items-center justify-center rounded-full border border-[#d6d6d6] bg-transparent px-2 text-sm font-semibold text-[#454545]">
                {props.newQty}
              </span>
              <form action={adjustDineInLineQtyAction}>
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
            <DineInRemoveLineWithConfirm
              lineId={line.id}
              qtyKotSent={line.qtyKotSent}
              className="cursor-pointer rounded-full p-1 text-[#ef4444] transition-colors hover:bg-red-50 hover:text-red-600"
              trashIconClassName="size-5"
              aria-label="Remove from cart"
            />
          </div>
        ) : (
          <form action={addDineInLineAction} className="mt-auto w-full pt-2">
            <input type="hidden" name="billId" value={billId} />
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="qty" value={1} />
            <Button
              type="submit"
              className="mx-auto flex h-auto w-[217px] max-w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border-0 bg-[#f97316] px-4 py-1 text-[12px] font-semibold text-white hover:bg-[#ea580c]"
            >
              <Plus className="size-3.5" aria-hidden />
              Add
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
