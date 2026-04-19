import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  billLines,
  bills,
  businessSettings,
  categories,
  diningTables,
  inventoryItems,
  products,
} from "@/lib/db/schema";

/** Normalize Drizzle `timestamp_ms` (Date) and any numeric / serialized values for JSON ingest. */
function iso(d: Date | number | string | null | undefined): string | null {
  if (d == null) return null;
  if (typeof d === "number") return new Date(d).toISOString();
  if (typeof d === "string") {
    const t = Date.parse(d);
    if (Number.isNaN(t)) return null;
    return new Date(t).toISOString();
  }
  return d.toISOString();
}

export async function buildIngestPayloadV1(storeId: string, secret: string) {
  const [
    billRows,
    lineRows,
    invRows,
    categoryRows,
    productRows,
    tableRows,
    biz,
  ] = await Promise.all([
    db.select().from(bills),
    db.select().from(billLines),
    db.select().from(inventoryItems),
    db.select().from(categories),
    db.select().from(products),
    db.select().from(diningTables),
    db.select().from(businessSettings).where(eq(businessSettings.id, 1)).limit(1),
  ]);

  const businessRow = biz[0];

  return {
    version: 1 as const,
    syncedAt: new Date().toISOString(),
    storeId,
    secret,
    categories: categoryRows.map((c) => ({
      deviceCategoryId: c.id,
      name: c.name,
      iconKey: c.iconKey,
      colorHex: c.colorHex,
      createdAt: iso(c.createdAt)!,
    })),
    products: productRows.map((p) => ({
      deviceProductId: p.id,
      deviceCategoryId: p.categoryId,
      name: p.name,
      imageLocalPath: p.imageLocalPath,
      priceRupee: p.priceRupee,
      includeInKot: p.includeInKot,
      active: p.active,
      createdAt: iso(p.createdAt)!,
    })),
    diningTables: tableRows.map((t) => ({
      deviceTableId: t.id,
      name: t.name,
      createdAt: iso(t.createdAt)!,
    })),
    bills: billRows.map((b) => ({
      deviceBillId: b.id,
      billNumber: b.billNumber,
      status: b.status,
      orderType: b.orderType,
      tableId: b.tableId,
      paymentMethod: b.paymentMethod,
      discountType: b.discountType,
      discountValue: b.discountValue,
      discountRupee: b.discountRupee,
      subtotalRupee: b.subtotalRupee,
      totalRupee: b.totalRupee,
      createdAt: iso(b.createdAt)!,
      completedAt: iso(b.completedAt),
    })),
    billLines: lineRows.map((l) => ({
      deviceLineId: l.id,
      deviceBillId: l.billId,
      productId: l.productId,
      qty: l.qty,
      productNameSnapshot: l.productNameSnapshot,
      unitPriceRupeeSnapshot: l.unitPriceRupeeSnapshot,
      includeInKotSnapshot: l.includeInKotSnapshot,
      lineTotalRupee: l.lineTotalRupee,
      qtyKotSent: l.qtyKotSent,
    })),
    inventoryItems: invRows.map((i) => ({
      deviceInventoryId: i.id,
      name: i.name,
      unit: i.unit,
      quantity: i.quantity,
      maxStock: i.maxStock,
      category: i.category,
      reorderQty: i.reorderQty,
      createdAt: iso(i.createdAt)!,
    })),
    business: businessRow
      ? {
          shopName: businessRow.shopName,
          ownerName: businessRow.ownerName,
          phone: businessRow.phone,
          address: businessRow.address,
          gstNumber: businessRow.gstNumber,
        }
      : null,
  };
}
