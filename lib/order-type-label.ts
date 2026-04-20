export type BillOrderType = "dine_in" | "takeaway";

/** Label for receipts, KOT, and print preview. */
export function formatOrderTypeLabel(orderType: BillOrderType): string {
  return orderType === "dine_in" ? "Dine in" : "Takeaway";
}
