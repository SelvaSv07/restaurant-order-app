"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { inventoryItems } from "@/lib/db/schema";

export async function addInventoryItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim() || "General";
  const quantity = Number(formData.get("quantity"));
  const maxStock = Number(formData.get("maxStock"));
  const reorderQty = Number(formData.get("reorderQty"));
  if (!name || !unit) return;
  await db.insert(inventoryItems).values({
    name,
    unit,
    category,
    quantity: Number.isFinite(quantity) ? Math.max(0, Math.floor(quantity)) : 0,
    maxStock: Number.isFinite(maxStock) && maxStock > 0 ? Math.floor(maxStock) : null,
    reorderQty: Number.isFinite(reorderQty) ? Math.max(0, Math.floor(reorderQty)) : 0,
  });
  revalidatePath("/inventory");
}

export async function setInventoryQuantity(formData: FormData) {
  const id = Number(formData.get("id"));
  const quantity = Number(formData.get("quantity"));
  if (!Number.isFinite(id) || !Number.isFinite(quantity)) return;
  const next = Math.max(0, Math.floor(quantity));
  const [row] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, id));
  if (!row) return;
  await db.update(inventoryItems).set({ quantity: next }).where(eq(inventoryItems.id, id));
  revalidatePath("/inventory");
}
