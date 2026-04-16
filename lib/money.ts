const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatINR(valueRupee: number): string {
  return inrFormatter.format(Math.round(valueRupee));
}

export function parseRupeeInput(value: string): number {
  const numeric = value.replace(/[^\d-]/g, "");
  const parsed = Number.parseInt(numeric, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function percentageDiscount(amountRupee: number, percent: number): number {
  return Math.round((amountRupee * percent) / 100);
}

