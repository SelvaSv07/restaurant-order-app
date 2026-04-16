import { eq } from "drizzle-orm";

import { KotPrintToast } from "@/components/print/kot-print-toast";
import { db } from "@/lib/db";
import { billLines, bills } from "@/lib/db/schema";

export default async function PrintKotPage({ params }: { params: Promise<{ billId: string }> }) {
  const { billId } = await params;
  const [bill] = await db.select().from(bills).where(eq(bills.id, Number(billId)));
  const lines = await db
    .select()
    .from(billLines)
    .where(eq(billLines.billId, Number(billId)));
  const kotLines = lines.filter((line) => line.includeInKotSnapshot);

  if (!bill) return <p>KOT not found.</p>;

  return (
    <main className="mx-auto max-w-sm p-4">
      <KotPrintToast />
      <h1 className="text-center text-lg font-semibold">KOT</h1>
      <p className="text-center text-sm">Bill #{bill.billNumber}</p>
      <div className="mt-3 space-y-1 text-sm">
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

