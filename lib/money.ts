const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(valueRupee: number): string {
  return inrFormatter.format(Math.round(valueRupee));
}

/** Draft / on-process bills may still show ₹0 before lines are finalized — use this to hide that in UIs. */
export function shouldHideDraftZeroAmount(
  status: "draft" | "completed" | "voided",
  totalRupee: number,
): boolean {
  return status === "draft" && totalRupee === 0;
}

/** Draft / on-process rows may show 0 line qty before items are finalized — hide in list UIs. */
export function shouldHideDraftZeroQty(
  status: "draft" | "completed" | "voided",
  qty: number,
): boolean {
  return status === "draft" && qty === 0;
}

export function parseRupeeInput(value: string): number {
  const numeric = value.replace(/[^\d-]/g, "");
  const parsed = Number.parseInt(numeric, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function percentageDiscount(amountRupee: number, percent: number): number {
  return Math.round((amountRupee * percent) / 100);
}

