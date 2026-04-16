"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { recomputeBillTotals } from "@/lib/repository";

export async function applyDiscountAction(formData: FormData) {
  const billId = Number(formData.get("billId"));
  const discountType = String(formData.get("discountType")) as "none" | "fixed" | "percent";
  const discountValue = Number(formData.get("discountValue"));
  const [billRow] = await db.select({ orderType: bills.orderType }).from(bills).where(eq(bills.id, billId));
  await recomputeBillTotals(billId, discountType, discountValue || 0);
  revalidatePath("/billing");
  if (billRow?.orderType === "dine_in") revalidatePath("/dine-in");
}
