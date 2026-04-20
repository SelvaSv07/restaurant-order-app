import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bills, billLines, businessSettings, printerSettings } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";
import { formatBillNumberDisplay } from "@/lib/bill-number-display";
import { generateReceiptBytes } from "@/lib/thermal-printer";
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
    const [business] = await db.select().from(businessSettings).where(eq(businessSettings.id, 1));
    const [printer] = await db.select().from(printerSettings).where(eq(printerSettings.id, 1));

    if (!printer.receiptPrinterName) {
      return NextResponse.json(
        { ok: false, error: "No receipt printer configured. Go to Settings → Printer." },
        { status: 400 },
      );
    }

    const receiptBytes = generateReceiptBytes({
      shopName: business.shopName,
      address: business.address,
      billNumber: formatBillNumberDisplay(bill.billNumber),
      billDate: bill.createdAt,
      orderType: bill.orderType,
      items: lines.map((l) => ({
        name: l.productNameSnapshot,
        qty: l.qty,
        lineTotal: l.lineTotalRupee,
      })),
      subtotal: bill.subtotalRupee,
      discount: bill.discountRupee,
      total: bill.totalRupee,
      paymentMethod: bill.paymentMethod ?? "cash",
      headerText: printer.headerText,
      footerText: printer.footerText,
      paperWidth: printer.paperWidth,
    });

    sendRawToPrinter(
      printer.receiptPrinterName,
      receiptBytes,
      `Receipt-${formatBillNumberDisplay(bill.billNumber)}`,
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to print receipt:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Print failed" },
      { status: 500 },
    );
  }
}
