import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { printerSettings } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";

export async function GET() {
  await ensureDefaults();
  const [row] = await db.select().from(printerSettings).where(eq(printerSettings.id, 1));
  if (!row) {
    return NextResponse.json(
      { receiptPrinterName: "", kotPrinterName: "" },
      { status: 200 },
    );
  }
  return NextResponse.json({
    receiptPrinterName: row.receiptPrinterName,
    kotPrinterName: row.kotPrinterName,
  });
}
