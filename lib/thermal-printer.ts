/**
 * ESC/POS thermal printer utilities for receipt and KOT generation.
 * Ported from the working billing-desktop implementation.
 */

import { formatOrderTypeLabel, type BillOrderType } from "@/lib/order-type-label";

const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: Buffer.from([ESC, 0x40]),
  ALIGN_LEFT: Buffer.from([ESC, 0x61, 0x00]),
  ALIGN_CENTER: Buffer.from([ESC, 0x61, 0x01]),
  BOLD_ON: Buffer.from([ESC, 0x45, 0x01]),
  BOLD_OFF: Buffer.from([ESC, 0x45, 0x00]),
  feedLines: (n: number): Buffer => Buffer.from([ESC, 0x64, n]),
  PARTIAL_CUT: Buffer.from([GS, 0x56, 0x42, 0x03]),
} as const;

// ── 80mm paper ─────────────────────────────────────────────────────────────────
const LINE_80 = 48;
const SEP_80 = "-".repeat(LINE_80);
const COL_ITEM_80 = 24;
const COL_QTY_80 = 8;
const COL_PRICE_80 = 16;

// ── 58mm paper ─────────────────────────────────────────────────────────────────
// Many 58mm ESC/POS units wrap before 32 chars; 28 fits one line reliably (rule + item grid).
const LINE_58 = 28;
const SEP_58 = "-".repeat(LINE_58);
const COL_ITEM_58 = 14;
const COL_QTY_58 = 7;
const COL_PRICE_58 = 7;

function text(str: string): Buffer {
  return Buffer.from(str, "ascii");
}

function line(str: string): Buffer {
  return text(str + "\n");
}

function rightAlign(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return " ".repeat(width - str.length) + str;
}

function leftAlign(str: string, width: number): string {
  if (str.length >= width) return str.slice(0, width);
  return str + " ".repeat(width - str.length);
}

function labelValueLine(label: string, value: string, lineWidth: number): string {
  const gap = lineWidth - label.length - value.length;
  return label + " ".repeat(Math.max(1, gap)) + value;
}

function formatDate(ts: Date | number): string {
  const d = typeof ts === "number" ? new Date(ts) : ts;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${dd}/${mm}/${yyyy}, ${String(hours).padStart(2, "0")}:${minutes} ${ampm}`;
}

// ── Receipt ────────────────────────────────────────────────────────────────────

export interface ReceiptData {
  shopName: string;
  address: string;
  billNumber: string;
  billDate: Date | number;
  orderType: BillOrderType;
  items: Array<{ name: string; qty: number; lineTotal: number }>;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  headerText: string;
  footerText: string;
  paperWidth: "58mm" | "80mm";
}

export function generateReceiptBytes(data: ReceiptData): Buffer {
  const is58 = data.paperWidth === "58mm";
  const LW = is58 ? LINE_58 : LINE_80;
  const SEP = is58 ? SEP_58 : SEP_80;
  const CI = is58 ? COL_ITEM_58 : COL_ITEM_80;
  const CQ = is58 ? COL_QTY_58 : COL_QTY_80;
  const CP = is58 ? COL_PRICE_58 : COL_PRICE_80;

  const parts: Buffer[] = [];
  const push = (...bufs: Buffer[]) => {
    for (const b of bufs) parts.push(b);
  };

  push(CMD.INIT);

  // Header
  push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
  push(line(data.shopName));
  push(CMD.BOLD_OFF);
  if (data.address) push(line(data.address));

  push(line(SEP));

  // Bill info
  push(CMD.ALIGN_LEFT);
  push(line(`Bill No: ${data.billNumber}`));
  push(line(`Date: ${formatDate(data.billDate)}`));
  push(line(`Order: ${formatOrderTypeLabel(data.orderType)}`));

  push(line(SEP));

  // Item header
  push(CMD.BOLD_ON);
  push(line(leftAlign("Item", CI) + rightAlign("Qty", CQ) + rightAlign("Price", CP)));
  push(CMD.BOLD_OFF);

  // Items
  for (const item of data.items) {
    const nameStr = leftAlign(item.name, CI);
    const qtyStr = rightAlign(String(item.qty), CQ);
    const priceStr = rightAlign(String(item.lineTotal), CP);
    push(line(nameStr + qtyStr + priceStr));
  }

  push(line(SEP));

  // Totals
  push(line(labelValueLine("Subtotal:", String(data.subtotal), LW)));
  if (data.discount > 0) {
    push(line(labelValueLine("Discount:", `- ${data.discount}`, LW)));
  }

  push(line(SEP));

  push(CMD.BOLD_ON);
  push(line(labelValueLine("TOTAL:", String(data.total), LW)));
  push(CMD.BOLD_OFF);

  push(line(labelValueLine("Payment:", data.paymentMethod, LW)));

  push(line(SEP));

  // Footer
  push(CMD.ALIGN_CENTER);
  if (data.headerText) push(line(data.headerText));
  if (data.footerText) push(line(data.footerText));

  push(CMD.feedLines(2), CMD.PARTIAL_CUT);

  return Buffer.concat(parts);
}

// ── KOT ────────────────────────────────────────────────────────────────────────

export interface KotData {
  billNumber: string;
  billDate: Date | number;
  orderType: BillOrderType;
  items: Array<{ name: string; qty: number }>;
  paperWidth: "58mm" | "80mm";
}

export function generateKotBytes(data: KotData): Buffer {
  const is58 = data.paperWidth === "58mm";
  const SEP = is58 ? SEP_58 : SEP_80;
  const CI = is58 ? COL_ITEM_58 : COL_ITEM_80;
  const CQ = is58 ? COL_QTY_58 : COL_QTY_80;

  const parts: Buffer[] = [];
  const push = (...bufs: Buffer[]) => {
    for (const b of bufs) parts.push(b);
  };

  push(CMD.INIT);

  push(CMD.ALIGN_CENTER, CMD.BOLD_ON);
  push(line("KOT"));
  push(CMD.BOLD_OFF);

  push(CMD.ALIGN_LEFT);
  push(line(`Bill No: ${data.billNumber}`));
  push(line(`Date: ${formatDate(data.billDate)}`));
  push(line(`Order: ${formatOrderTypeLabel(data.orderType)}`));

  push(line(SEP));

  push(CMD.BOLD_ON);
  push(line(leftAlign("Item", CI) + rightAlign("Qty", CQ)));
  push(CMD.BOLD_OFF);

  for (const item of data.items) {
    push(line(leftAlign(item.name, CI) + rightAlign(String(item.qty), CQ)));
  }

  push(line(SEP));
  push(CMD.feedLines(2), CMD.PARTIAL_CUT);

  return Buffer.concat(parts);
}
