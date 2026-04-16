"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { billLines, bills, products } from "@/lib/db/schema";
import { recomputeBillTotals } from "@/lib/repository";

export async function addLineAction(formData: FormData) {
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
      .set({
        qty: nextQty,
        lineTotalRupee: nextQty * existing.unitPriceRupeeSnapshot,
        qtyKotSent: nextQty,
      })
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
      qtyKotSent: qty,
    });
  }

  const [billRow] = await db.select().from(bills).where(eq(bills.id, billId));
  if (billRow) await recomputeBillTotals(billId, billRow.discountType, billRow.discountValue);
  revalidatePath("/billing");
}

export async function adjustLineQtyAction(formData: FormData) {
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
        qtyKotSent: next,
      })
      .where(eq(billLines.id, lineId));
  }
  await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
  revalidatePath("/billing");
}

export async function removeLineAction(formData: FormData) {
  const lineId = Number(formData.get("lineId"));
  const [line] = await db.select().from(billLines).where(eq(billLines.id, lineId));
  if (!line) return;
  const [bill] = await db.select().from(bills).where(eq(bills.id, line.billId));
  if (!bill) return;
  await db.delete(billLines).where(eq(billLines.id, lineId));
  await recomputeBillTotals(bill.id, bill.discountType, bill.discountValue);
  revalidatePath("/billing");
}
