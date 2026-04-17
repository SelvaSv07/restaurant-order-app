import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bills, billLines, printerSettings } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";
import { generateKotBytes } from "@/lib/thermal-printer";
import { sendRawToPrinter } from "@/lib/print-raw";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const billId = Number(id);
    if (Number.isNaN(billId)) {
      return NextResponse.json({ ok: false, error: "Invalid bill ID" }, { status: 400 });
    }

    await ensureDefaults();
    const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
    if (!bill) {
      return NextResponse.json({ ok: false, error: "Bill not found" }, { status: 404 });
    }

    const lines = await db.select().from(billLines).where(eq(billLines.billId, billId));
    const [printer] = await db.select().from(printerSettings).where(eq(printerSettings.id, 1));

    // Filter to KOT items only
    const kotLines = lines.filter((l) => l.includeInKotSnapshot);
    if (kotLines.length === 0) {
      return NextResponse.json({ ok: true, message: "No KOT items to print" });
    }

    if (!printer.kotPrinterName) {
      return NextResponse.json(
        { ok: false, error: "No KOT printer configured. Go to Settings → Printer." },
        { status: 400 },
      );
    }

    // For dine-in, only print unsent items
    let itemsToPrint = kotLines;
    if (bill.orderType === "dine_in") {
      itemsToPrint = kotLines
        .filter((l) => l.qty > l.qtyKotSent)
        .map((l) => ({ ...l, qty: l.qty - l.qtyKotSent }));
      if (itemsToPrint.length === 0) {
        return NextResponse.json({ ok: true, message: "No new KOT items to print" });
      }
    }

    const kotBytes = generateKotBytes({
      billNumber: bill.billNumber,
      billDate: bill.createdAt,
      items: itemsToPrint.map((l) => ({
        name: l.productNameSnapshot,
        qty: l.qty,
      })),
      paperWidth: printer.paperWidth,
    });

    sendRawToPrinter(printer.kotPrinterName, kotBytes, `KOT-${bill.billNumber}`);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to print KOT:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Print failed" },
      { status: 500 },
    );
  }
}
