"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { billLines, bills } from "@/lib/db/schema";

export type CompleteBillResult = { ok: true } | { ok: false };

export async function completeBillAction(formData: FormData): Promise<CompleteBillResult> {
  const billId = Number(formData.get("billId"));
  const paymentMethod = String(formData.get("paymentMethod")) as "cash" | "card" | "upi" | "other";
  const [hasLine] = await db
    .select({ id: billLines.id })
    .from(billLines)
    .where(eq(billLines.billId, billId))
    .limit(1);
  if (!hasLine) return { ok: false };

  const [billRow] = await db.select({ orderType: bills.orderType }).from(bills).where(eq(bills.id, billId));
  await db
    .update(bills)
    .set({ status: "completed", paymentMethod, completedAt: new Date() })
    .where(eq(bills.id, billId));
  revalidatePath("/billing");
  if (billRow?.orderType === "dine_in") revalidatePath("/dine-in");
  return { ok: true };
}
