import { eq } from "drizzle-orm";

import { KotPrintReadyBridge } from "@/components/print/kot-print-ready-bridge";
import { formatBillNumberDisplay } from "@/lib/bill-number-display";
import { formatOrderTypeLabel } from "@/lib/order-type-label";
import { db } from "@/lib/db";
import { billLines, bills } from "@/lib/db/schema";

export default async function PrintKotPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  const id = Number(billId);
  const [bill] = await db.select().from(bills).where(eq(bills.id, id));
  const lines = await db.select().from(billLines).where(eq(billLines.billId, id));

  if (!bill) return <p>KOT not found.</p>;

  if (bill.orderType === "takeaway") {
    const kotLines = lines.filter((line) => line.includeInKotSnapshot);
    return (
      <main className="mx-auto max-w-sm px-3 py-2">
        <KotPrintReadyBridge billId={id} />
        <h1 className="text-center text-lg font-semibold leading-tight">KOT</h1>
        <p className="text-center text-sm leading-snug">Bill #{formatBillNumberDisplay(bill.billNumber)}</p>
        <p className="mt-0.5 text-center text-sm leading-snug">Order: {formatOrderTypeLabel(bill.orderType)}</p>
        <div className="mt-2 space-y-0.5 text-sm">
          {kotLines.map((line) => (
            <div key={line.id} className="flex justify-between">
              <span>{line.productNameSnapshot}</span>
              <span>x {line.qty}</span>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const kotUnsent = lines
    .filter((line) => line.includeInKotSnapshot && line.qty > line.qtyKotSent)
    .map((line) => ({
      id: line.id,
      name: line.productNameSnapshot,
      qty: line.qty - line.qtyKotSent,
    }));

  return (
    <main className="mx-auto max-w-sm px-3 py-2">
      <KotPrintReadyBridge billId={id} />
      <h1 className="text-center text-lg font-semibold leading-tight">KOT</h1>
      <p className="text-center text-sm leading-snug">Bill #{formatBillNumberDisplay(bill.billNumber)}</p>
      <p className="mt-0.5 text-center text-sm leading-snug">Order: {formatOrderTypeLabel(bill.orderType)}</p>
      <p className="mt-1 text-center text-xs leading-snug text-muted-foreground">
        Preview of items not yet sent. Use Update order on Dine-in to print and mark sent.
      </p>
      <div className="mt-2 space-y-0.5 text-sm">
        {kotUnsent.length === 0 ? (
          <p className="text-center text-muted-foreground">Nothing new to send to kitchen.</p>
        ) : (
          kotUnsent.map((row) => (
            <div key={row.id} className="flex justify-between">
              <span>{row.name}</span>
              <span>x {row.qty}</span>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
