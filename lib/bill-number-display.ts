/**
 * Human-facing bill number (UI, receipts, KOT). Stored `bill_number` is `ddmmyy-seq` (IST date + sequence).
 */
export const BILL_NUMBER_DISPLAY_PREFIX = "SH";

export function formatBillNumberDisplay(storedBillNumber: string): string {
  return `${BILL_NUMBER_DISPLAY_PREFIX}-${storedBillNumber}`;
}
