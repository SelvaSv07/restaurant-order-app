import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { billLines, bills, businessSettings, printerSettings } from "@/lib/db/schema";
import { formatINR } from "@/lib/money";
import { ensureDefaults } from "@/lib/repository";

export default async function PrintBillPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  await ensureDefaults();
  const [bill] = await db.select().from(bills).where(eq(bills.id, Number(billId)));
  const lines = await db.select().from(billLines).where(eq(billLines.billId, Number(billId)));
  const [business] = await db.select().from(businessSettings).where(eq(businessSettings.id, 1));
  const [printer] = await db.select().from(printerSettings).where(eq(printerSettings.id, 1));

  if (!bill) return <p>Bill not found.</p>;

  return (
    <main className={`mx-auto p-4 ${printer.paperWidth === "58mm" ? "max-w-[280px]" : "max-w-md"}`}>
      <h1 className="text-center text-lg font-semibold">{business.shopName}</h1>
      <p className="text-center text-xs">{business.address}</p>
      <p className="mt-3 text-sm">Bill #{bill.billNumber}</p>
      <div className="mt-2 space-y-1 text-sm">
        {lines.map((line) => (
          <div key={line.id} className="flex justify-between">
            <span>
              {line.productNameSnapshot} x {line.qty}
            </span>
            <span>{formatINR(line.lineTotalRupee)}</span>
          </div>
        ))}
      </div>
      <hr className="my-2" />
      <p className="flex justify-between text-sm">
        <span>Subtotal</span>
        <span>{formatINR(bill.subtotalRupee)}</span>
      </p>
      <p className="flex justify-between text-sm">
        <span>Discount</span>
        <span>{formatINR(bill.discountRupee)}</span>
      </p>
      <p className="flex justify-between text-base font-semibold">
        <span>Total</span>
        <span>{formatINR(bill.totalRupee)}</span>
      </p>
      <p className="mt-3 text-center text-xs">{printer.headerText}</p>
      <p className="text-center text-xs">{printer.footerText}</p>
    </main>
  );
}

