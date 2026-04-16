export type InventoryStatus = "available" | "low" | "out";

export function getInventoryStatus(item: {
  quantity: number;
  maxStock: number | null;
}): InventoryStatus {
  if (item.quantity <= 0) return "out";
  if (item.maxStock && item.maxStock > 0 && item.quantity * 100 < item.maxStock * 20) {
    return "low";
  }
  return "available";
}

export function stockFillPercent(item: {
  quantity: number;
  maxStock: number | null;
}): number {
  if (item.quantity <= 0) return 0;
  if (!item.maxStock || item.maxStock <= 0) return 100;
  return Math.min(100, (item.quantity / item.maxStock) * 100);
}

const SUPPLY_LABELS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"] as const;

export function buildSupplyOverviewSeries(totalUnits: number) {
  const n = SUPPLY_LABELS.length;
  if (n <= 1) return [{ month: SUPPLY_LABELS[0], value: Math.max(0, totalUnits) }];
  const start = Math.max(0, Math.floor(totalUnits * 0.55));
  return SUPPLY_LABELS.map((month, i) => ({
    month,
    value: Math.round(start + ((totalUnits - start) * i) / (n - 1)),
  }));
}

export function splitStockBars(inCount: number, lowCount: number, outCount: number) {
  const bars = 30;
  const total = inCount + lowCount + outCount;
  if (total === 0) {
    return Array.from({ length: bars }, () => "muted" as const);
  }
  const nIn = Math.floor((bars * inCount) / total);
  const nLow = Math.floor((bars * lowCount) / total);
  const nOut = bars - nIn - nLow;
  const row: Array<"in" | "low" | "out"> = [];
  for (let i = 0; i < nIn; i++) row.push("in");
  for (let i = 0; i < nLow; i++) row.push("low");
  for (let i = 0; i < nOut; i++) row.push("out");
  return row;
}
