"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { bills, diningTables } from "@/lib/db/schema";
import { getBillWithLines } from "@/lib/repository";

/** Draft bills are removed; completed bills are voided (canceled). */
export async function deleteOrVoidBillAction(billId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  if (!bill) return { ok: false, error: "not_found" };
  if (bill.status === "voided") return { ok: false, error: "already_void" };

  if (bill.status === "draft") {
    await db.delete(bills).where(eq(bills.id, billId));
  } else {
    await db.update(bills).set({ status: "voided" }).where(eq(bills.id, billId));
  }

  revalidatePath("/bills");
  revalidatePath("/dashboard");
  if (bill.orderType === "dine_in") revalidatePath("/dine-in");
  if (bill.orderType === "takeaway") revalidatePath("/billing");

  return { ok: true };
}

export async function getBillDetailAction(billId: number) {
  const { bill, lines } = await getBillWithLines(billId);
  if (!bill) return { ok: false as const, error: "not_found" as const };

  let tableName: string | null = null;
  if (bill.tableId != null) {
    const [row] = await db
      .select({ name: diningTables.name })
      .from(diningTables)
      .where(eq(diningTables.id, bill.tableId));
    tableName = row?.name ?? null;
  }

  return { ok: true as const, bill, lines, tableName };
}
