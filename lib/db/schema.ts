import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  iconKey: text("icon_key").notNull().default("Utensils"),
  colorHex: text("color_hex").notNull().default("#f97316"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  imageLocalPath: text("image_local_path"),
  priceRupee: integer("price_rupee").notNull(),
  includeInKot: integer("include_in_kot", { mode: "boolean" })
    .notNull()
    .default(false),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const diningTables = sqliteTable("dining_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const bills = sqliteTable(
  "bills",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    billNumber: text("bill_number").notNull(),
    status: text("status", { enum: ["draft", "completed", "voided"] })
      .notNull()
      .default("draft"),
    orderType: text("order_type", { enum: ["dine_in", "takeaway"] }).notNull(),
    tableId: integer("table_id").references(() => diningTables.id, {
      onDelete: "set null",
    }),
    paymentMethod: text("payment_method", {
      enum: ["cash", "card", "upi", "other"],
    }),
    discountType: text("discount_type", { enum: ["none", "fixed", "percent"] })
      .notNull()
      .default("none"),
    discountValue: integer("discount_value").notNull().default(0),
    discountRupee: integer("discount_rupee").notNull().default(0),
    subtotalRupee: integer("subtotal_rupee").notNull().default(0),
    totalRupee: integer("total_rupee").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .default(sql`(unixepoch('subsec') * 1000)`),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => [uniqueIndex("bills_bill_number_idx").on(table.billNumber)],
);

export const billLines = sqliteTable("bill_lines", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  billId: integer("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  qty: integer("qty").notNull(),
  productNameSnapshot: text("product_name_snapshot").notNull(),
  unitPriceRupeeSnapshot: integer("unit_price_rupee_snapshot").notNull(),
  includeInKotSnapshot: integer("include_in_kot_snapshot", { mode: "boolean" })
    .notNull()
    .default(false),
  lineTotalRupee: integer("line_total_rupee").notNull(),
  /** Qty already included in a printed KOT (dine-in); remainder is "new" */
  qtyKotSent: integer("qty_kot_sent").notNull().default(0),
});

export const inventoryItems = sqliteTable("inventory_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  unit: text("unit").notNull(),
  quantity: integer("quantity").notNull().default(0),
  maxStock: integer("max_stock"),
  category: text("category").notNull().default("General"),
  reorderQty: integer("reorder_qty").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch('subsec') * 1000)`),
});

export const businessSettings = sqliteTable("business_settings", {
  id: integer("id").primaryKey(),
  shopName: text("shop_name").notNull().default("My Restaurant"),
  ownerName: text("owner_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  address: text("address").notNull().default(""),
  gstNumber: text("gst_number").notNull().default(""),
});

export const printerSettings = sqliteTable("printer_settings", {
  id: integer("id").primaryKey(),
  headerText: text("header_text").notNull().default("Thank you!"),
  footerText: text("footer_text").notNull().default("Visit again"),
  paperWidth: text("paper_width", { enum: ["58mm", "80mm"] })
    .notNull()
    .default("80mm"),
  /** Windows printer name for receipt/bill; empty = OS default in Electron silent print */
  receiptPrinterName: text("receipt_printer_name").notNull().default(""),
  /** Kitchen (KOT) printer name; empty = OS default */
  kotPrinterName: text("kot_printer_name").notNull().default(""),
});

/** Single-row settings for pushing snapshots to the hosted master admin API. */
export const cloudSyncSettings = sqliteTable("cloud_sync_settings", {
  id: integer("id").primaryKey(),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
  endpointBaseUrl: text("endpoint_base_url").notNull().default(""),
  storeId: text("store_id").notNull().default(""),
  syncSecret: text("sync_secret").notNull().default(""),
  lastSyncAt: integer("last_sync_at", { mode: "timestamp_ms" }),
  lastError: text("last_error").notNull().default(""),
  lastPayloadVersion: integer("last_payload_version").notNull().default(1),
});

