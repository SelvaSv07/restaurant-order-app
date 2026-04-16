"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { billLines, bills, products } from "@/lib/db/schema";
import { recomputeBillTotals } from "@/lib/repository";

export async function addDineInLineAction(formData: FormData) {
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
      qtyKotSent: 0,
    });
  }

  const [billRow] = await db.select().from(bills).where(eq(bills.id, billId));
  if (billRow) await recomputeBillTotals(billId, billRow.discountType, billRow.discountValue);
  revalidatePath("/dine-in");
}

export async function adjustDineInLineQtyAction(formData: FormData) {
  const lineId = Number(formData.get("lineId"));
  const delta = Number(formData.get("delta"));
  const reduceSent = formData.get("reduceSent") === "true";
  const [line] = await db.select().from(billLines).where(eq(billLines.id, lineId));
  if (!line || delta === 0) return;
  const [bill] = await db.select().from(bills).where(eq(bills.id, line.billId));
  if (!bill) return;

  /** Reduce both quantity and kitchen-sent count (after warning in UI). */
  if (reduceSent) {
    if (delta !== -1 || line.qtyKotSent <= 0) return;
    const nextQty = line.qty - 1;
    const nextKot = line.qtyKotSent - 1;
    if (nextQty < 0 || nextKot < 0 || nextQty < nextKot) return;
    if (nextQty <= 0) {
      await db.delete(billLines).where(eq(billLines.id, lineId));
    } else {
      await db
        .update(billLines)
        .set({
          qty: nextQty,
          qtyKotSent: nextKot,
          lineTotalRupee: nextQty * line.unitPriceRupeeSnapshot,
        })
        .where(eq(billLines.id, lineId));
    }
    await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
    revalidatePath("/dine-in");
    return;
  }

  const next = line.qty + delta;
  const floor = line.qtyKotSent;
  if (next < floor) return;
  if (next <= 0) {
    if (floor > 0) return;
    await db.delete(billLines).where(eq(billLines.id, lineId));
  } else {
    await db
      .update(billLines)
      .set({
        qty: next,
        lineTotalRupee: next * line.unitPriceRupeeSnapshot,
        qtyKotSent: Math.min(line.qtyKotSent, next),
      })
      .where(eq(billLines.id, lineId));
  }
  await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
  revalidatePath("/dine-in");
}

export type MarkDineInKotResult =
  | { ok: true; billNumber: string; rows: { id: number; name: string; qty: number }[] }
  | { ok: false; error: "not_found" | "not_dine_in" };

/** Mark all line qty as sent to kitchen after KOT; safe to call from client (not during RSC render). */
export async function markDineInKotPrintedAction(billId: number): Promise<MarkDineInKotResult> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) return { ok: false, error: "not_found" };
  if (bill.orderType !== "dine_in") return { ok: false, error: "not_dine_in" };

  const lines = await db.select().from(billLines).where(eq(billLines.billId, billId));

  const kotUnsent = lines
    .filter((line) => line.includeInKotSnapshot && line.qty > line.qtyKotSent)
    .map((line) => ({
      id: line.id,
      name: line.productNameSnapshot,
      qty: line.qty - line.qtyKotSent,
    }));

  for (const line of lines) {
    await db.update(billLines).set({ qtyKotSent: line.qty }).where(eq(billLines.id, line.id));
  }
  revalidatePath("/dine-in");

  return { ok: true, billNumber: bill.billNumber, rows: kotUnsent };
}

export async function removeDineInLineAction(formData: FormData) {
  const lineId = Number(formData.get("lineId"));
  const [line] = await db.select().from(billLines).where(eq(billLines.id, lineId));
  if (!line) return;
  const [bill] = await db.select().from(bills).where(eq(bills.id, line.billId));
  if (!bill) return;
  await db.delete(billLines).where(eq(billLines.id, lineId));
  await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
  revalidatePath("/dine-in");
}
