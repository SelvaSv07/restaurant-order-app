import { and, asc, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { db, sqliteRaw } from "@/lib/db";
import {
  billLines,
  bills,
  businessSettings,
  categories,
  cloudSyncSettings,
  diningTables,
  inventoryItems,
  printerSettings,
  products,
} from "@/lib/db/schema";
import type { ChartBucket } from "@/lib/chart-series";
import { mergeRevenueChart, TODAY_CHART_HOUR_WINDOW } from "@/lib/chart-series";
import type { PeriodPreset } from "@/lib/ist";
import { resolvePreviousComparisonRange, resolvePresetRange } from "@/lib/ist";
import { percentageDiscount } from "@/lib/money";

/** Exclude empty carts: no lines or total line qty is 0. */
const billHasPositiveLineQty = sql`(select coalesce(sum(${billLines.qty}), 0) from ${billLines} where ${billLines.billId} = ${bills.id}) > 0`;

/** Bootstrap table if migrations haven’t applied yet (keeps `next build` prerender paths working). */
function ensureCloudSyncTableIfMissing() {
  sqliteRaw.exec(`
    CREATE TABLE IF NOT EXISTS cloud_sync_settings (
      id integer PRIMARY KEY NOT NULL,
      enabled integer DEFAULT false NOT NULL,
      endpoint_base_url text DEFAULT '' NOT NULL,
      store_id text DEFAULT '' NOT NULL,
      sync_secret text DEFAULT '' NOT NULL,
      last_sync_at integer,
      last_error text DEFAULT '' NOT NULL,
      last_payload_version integer DEFAULT 1 NOT NULL
    );
  `);
}

/** Apply printer column DDL if missing (older DB files; keeps `next build` prerender working). */
function ensurePrinterDeviceColumnsIfMissing() {
  try {
    sqliteRaw.exec(
      `ALTER TABLE printer_settings ADD COLUMN receipt_printer_name text NOT NULL DEFAULT ''`,
    );
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    if (!m.includes("duplicate column")) throw e;
  }
  try {
    sqliteRaw.exec(`ALTER TABLE printer_settings ADD COLUMN kot_printer_name text NOT NULL DEFAULT ''`);
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    if (!m.includes("duplicate column")) throw e;
  }
}

export async function ensureDefaults() {
  ensurePrinterDeviceColumnsIfMissing();
  ensureCloudSyncTableIfMissing();

  const business = await db.select().from(businessSettings).where(eq(businessSettings.id, 1));
  if (business.length === 0) {
    await db.insert(businessSettings).values({ id: 1 });
  }

  const printer = await db.select().from(printerSettings).where(eq(printerSettings.id, 1));
  if (printer.length === 0) {
    await db.insert(printerSettings).values({ id: 1 });
  }

  const cloudSync = await db.select().from(cloudSyncSettings).where(eq(cloudSyncSettings.id, 1));
  if (cloudSync.length === 0) {
    await db.insert(cloudSyncSettings).values({ id: 1 });
  }
}

export async function getItemsSoldInRange(from: Date, to: Date) {
  const [row] = await db
    .select({ n: sql<number>`coalesce(sum(${billLines.qty}), 0)` })
    .from(billLines)
    .innerJoin(bills, eq(bills.id, billLines.billId))
    .where(
      and(
        eq(bills.status, "completed"),
        gte(bills.createdAt, from),
        lte(bills.createdAt, to),
      ),
    );
  return Number(row?.n ?? 0);
}

export async function getCategoryRevenueByRange(from: Date, to: Date) {
  return db
    .select({
      name: categories.name,
      total: sql<number>`coalesce(sum(${billLines.lineTotalRupee}), 0)`,
    })
    .from(billLines)
    .innerJoin(bills, eq(bills.id, billLines.billId))
    .innerJoin(products, eq(products.id, billLines.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(
      and(
        eq(bills.status, "completed"),
        gte(bills.createdAt, from),
        lte(bills.createdAt, to),
      ),
    )
    .groupBy(categories.id)
    .orderBy(desc(sql`sum(${billLines.lineTotalRupee})`));
}

/** Recent bills for the dashboard: latest within the given range (use IST today for “today only”). */
export async function getRecentBillsForDashboard(limit: number, from: Date, to: Date) {
  const list = await db
    .select()
    .from(bills)
    .where(
      and(
        inArray(bills.status, ["draft", "completed"]),
        gte(bills.createdAt, from),
        lte(bills.createdAt, to),
      ),
    )
    .orderBy(desc(bills.createdAt))
    .limit(limit);
  if (list.length === 0) return [];
  const ids = list.map((b) => b.id);
  const lines = await db.select().from(billLines).where(inArray(billLines.billId, ids));
  const byBill = new Map<number, (typeof lines)[number][]>();
  for (const line of lines) {
    const arr = byBill.get(line.billId) ?? [];
    arr.push(line);
    byBill.set(line.billId, arr);
  }
  return list.map((bill) => {
    const bl = byBill.get(bill.id) ?? [];
    const menuLabel = bl[0]?.productNameSnapshot ?? "—";
    const qty = bl.reduce((s, l) => s + l.qty, 0);
    return { bill, menuLabel, qty };
  });
}

export async function getDashboardStats(from: Date, to: Date, chartBucket: ChartBucket = "day") {
  const rows = await db
    .select({
      totalRupee: sql<number>`coalesce(sum(${bills.totalRupee}), 0)`,
      billCount: sql<number>`count(*)`,
    })
    .from(bills)
    .where(
      and(
        eq(bills.status, "completed"),
        gte(bills.createdAt, from),
        lte(bills.createdAt, to),
      ),
    );

  const chartWhere = and(
    eq(bills.status, "completed"),
    gte(bills.createdAt, from),
    lte(bills.createdAt, to),
  );

  const chart =
    chartBucket === "hour"
      ? await db
          .select({
            day: sql<string>`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
            totalRupee: sql<number>`coalesce(sum(${bills.totalRupee}), 0)`,
          })
          .from(bills)
          .where(chartWhere)
          .groupBy(
            sql`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
          )
          .orderBy(
            sql`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')) asc`,
          )
      : chartBucket === "day"
        ? await db
            .select({
              day: sql<string>`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`,
              totalRupee: sql<number>`coalesce(sum(${bills.totalRupee}), 0)`,
            })
            .from(bills)
            .where(chartWhere)
            .groupBy(
              sql`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`,
            )
            .orderBy(
              sql`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes') asc`,
            )
        : await db
            .select({
              day: sql<string>`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
              totalRupee: sql<number>`coalesce(sum(${bills.totalRupee}), 0)`,
            })
            .from(bills)
            .where(chartWhere)
            .groupBy(
              sql`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
            )
            .orderBy(
              sql`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')) asc`,
            );

  return { stats: rows[0], chart };
}

export async function getCategoriesWithProducts() {
  const allCategories = await db.select().from(categories).orderBy(asc(categories.name));
  const allProducts = await db.select().from(products).orderBy(asc(products.name));
  return { allCategories, allProducts };
}

export async function getSettingsData() {
  await ensureDefaults();
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const prods = await db
    .select()
    .from(products)
    .orderBy(asc(products.name));
  const business = await db.select().from(businessSettings).where(eq(businessSettings.id, 1));
  const printer = await db.select().from(printerSettings).where(eq(printerSettings.id, 1));
  return { cats, prods, business: business[0], printer: printer[0] };
}

type DbTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Next ORD-ddmmyy-### for today (IST). Must run on the same DB handle / transaction as the insert. */
function nextBillNumberInTx(tx: DbTx) {
  const todayPrefix = new Intl.DateTimeFormat("en-IN", {
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  })
    .format(new Date())
    .replace(/\//g, "");

  const match = tx
    .select({ billNumber: bills.billNumber })
    .from(bills)
    .where(sql`${bills.billNumber} like ${`${todayPrefix}-%`}`)
    .orderBy(desc(bills.billNumber))
    .limit(1)
    .all();

  const current = match[0]?.billNumber;
  const seq = current ? Number.parseInt(current.split("-")[1] ?? "0", 10) + 1 : 1;
  return `${todayPrefix}-${String(seq).padStart(3, "0")}`;
}

/**
 * Ensures a single open takeaway draft. Uses an immediate transaction so concurrent
 * page loads cannot each insert a new empty bill (race → duplicate ghost drafts).
 */
export function getOpenTakeawayBill() {
  return db.transaction(
    (tx) => {
      const existing = tx
        .select()
        .from(bills)
        .where(and(eq(bills.status, "draft"), eq(bills.orderType, "takeaway"), sql`${bills.tableId} is null`))
        .limit(1)
        .all();
      if (existing[0]) return existing[0];

      const billNumber = nextBillNumberInTx(tx);
      const inserted = tx
        .insert(bills)
        .values({
          billNumber,
          status: "draft",
          orderType: "takeaway",
        })
        .returning()
        .all();
      return inserted[0]!;
    },
    { behavior: "immediate" },
  );
}

export function getOpenTableBill(tableId: number) {
  return db.transaction(
    (tx) => {
      const existing = tx
        .select()
        .from(bills)
        .where(and(eq(bills.status, "draft"), eq(bills.orderType, "dine_in"), eq(bills.tableId, tableId)))
        .limit(1)
        .all();
      if (existing[0]) return existing[0];

      const billNumber = nextBillNumberInTx(tx);
      const inserted = tx
        .insert(bills)
        .values({
          billNumber,
          status: "draft",
          orderType: "dine_in",
          tableId,
        })
        .returning()
        .all();
      return inserted[0]!;
    },
    { behavior: "immediate" },
  );
}

export async function getBillWithLines(billId: number) {
  const [bill] = await db.select().from(bills).where(eq(bills.id, billId));
  const rows = await db
    .select({
      line: billLines,
      imageLocalPath: products.imageLocalPath,
      categoryIconKey: categories.iconKey,
      categoryColorHex: categories.colorHex,
    })
    .from(billLines)
    .innerJoin(products, eq(billLines.productId, products.id))
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(billLines.billId, billId));
  const lines = rows.map((r) => ({
    ...r.line,
    imageLocalPath: r.imageLocalPath,
    categoryIconKey: r.categoryIconKey,
    categoryColorHex: r.categoryColorHex,
  }));
  return { bill, lines };
}

export async function recomputeBillTotals(
  billId: number,
  discountType: "none" | "fixed" | "percent",
  discountValue: number,
) {
  const lines = await db.select().from(billLines).where(eq(billLines.billId, billId));
  const subtotal = lines.reduce((acc, line) => acc + line.lineTotalRupee, 0);
  let discountRupee = 0;
  if (discountType === "fixed") discountRupee = Math.min(subtotal, discountValue);
  if (discountType === "percent") discountRupee = Math.min(subtotal, percentageDiscount(subtotal, discountValue));
  const total = Math.max(0, subtotal - discountRupee);

  await db
    .update(bills)
    .set({ subtotalRupee: subtotal, discountType, discountValue, discountRupee, totalRupee: total })
    .where(eq(bills.id, billId));
}

export async function getBillsInRange(from: Date, to: Date) {
  return db
    .select()
    .from(bills)
    .where(and(eq(bills.status, "completed"), gte(bills.createdAt, from), lte(bills.createdAt, to)))
    .orderBy(desc(bills.createdAt));
}

export async function getBillStatusCounts(from: Date, to: Date) {
  const rows = await db
    .select({
      status: bills.status,
      count: sql<number>`count(*)`,
    })
    .from(bills)
    .where(and(gte(bills.createdAt, from), lte(bills.createdAt, to), billHasPositiveLineQty))
    .groupBy(bills.status);

  let draft = 0;
  let completed = 0;
  let voided = 0;
  for (const r of rows) {
    const n = Number(r.count);
    if (r.status === "draft") draft = n;
    else if (r.status === "completed") completed = n;
    else if (r.status === "voided") voided = n;
  }
  /** Total orders for analytics: draft + completed only (canceled excluded). */
  return { total: draft + completed, draft, completed, voided };
}

export async function getBillCountByDay(from: Date, to: Date, chartBucket: ChartBucket = "day") {
  const rangeWhere = and(
    gte(bills.createdAt, from),
    lte(bills.createdAt, to),
    inArray(bills.status, ["draft", "completed"]),
  );
  if (chartBucket === "hour") {
    return db
      .select({
        day: sql<string>`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
        count: sql<number>`count(*)`,
      })
      .from(bills)
      .where(rangeWhere)
      .groupBy(
        sql`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
      )
      .orderBy(
        sql`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')) asc`,
      );
  }
  if (chartBucket === "day") {
    return db
      .select({
        day: sql<string>`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`,
        count: sql<number>`count(*)`,
      })
      .from(bills)
      .where(rangeWhere)
      .groupBy(sql`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`)
      .orderBy(sql`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes') asc`);
  }
  return db
    .select({
      day: sql<string>`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
      count: sql<number>`count(*)`,
    })
    .from(bills)
    .where(rangeWhere)
    .groupBy(
      sql`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
    )
    .orderBy(
      sql`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')) asc`,
    );
}

export async function getCompletedBillCountByDay(from: Date, to: Date, chartBucket: ChartBucket = "day") {
  const completedWhere = and(
    eq(bills.status, "completed"),
    gte(bills.createdAt, from),
    lte(bills.createdAt, to),
  );
  if (chartBucket === "hour") {
    return db
      .select({
        day: sql<string>`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
        count: sql<number>`count(*)`,
      })
      .from(bills)
      .where(completedWhere)
      .groupBy(
        sql`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
      )
      .orderBy(
        sql`strftime('%Y-%m-%dT%H', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')) asc`,
      );
  }
  if (chartBucket === "day") {
    return db
      .select({
        day: sql<string>`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`,
        count: sql<number>`count(*)`,
      })
      .from(bills)
      .where(completedWhere)
      .groupBy(sql`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')`)
      .orderBy(sql`date(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes') asc`);
  }
  return db
    .select({
      day: sql<string>`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
      count: sql<number>`count(*)`,
    })
    .from(bills)
    .where(completedWhere)
    .groupBy(
      sql`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes'))`,
    )
    .orderBy(
      sql`strftime('%Y-%m', datetime(${bills.createdAt} / 1000, 'unixepoch', '+5 hours', '+30 minutes')) asc`,
    );
}

export async function getOrderTypeCounts(from: Date, to: Date) {
  const rows = await db
    .select({
      orderType: bills.orderType,
      count: sql<number>`count(*)`,
    })
    .from(bills)
    .where(
      and(
        gte(bills.createdAt, from),
        lte(bills.createdAt, to),
        inArray(bills.status, ["draft", "completed"]),
        billHasPositiveLineQty,
      ),
    )
    .groupBy(bills.orderType);

  let dineIn = 0;
  let takeaway = 0;
  for (const r of rows) {
    const n = Number(r.count);
    if (r.orderType === "dine_in") dineIn = n;
    else if (r.orderType === "takeaway") takeaway = n;
  }
  return { dineIn, takeaway, total: dineIn + takeaway };
}

export type BillsListStatus = "all" | "draft" | "completed" | "voided";

export type BillsListParams = {
  from: Date;
  to: Date;
  status: BillsListStatus;
  q: string;
  page: number;
  pageSize: number;
};

export async function getBillsListPage(params: BillsListParams) {
  const { from, to, status, q, page, pageSize } = params;
  const conditions = [gte(bills.createdAt, from), lte(bills.createdAt, to), billHasPositiveLineQty];
  if (status !== "all") {
    conditions.push(eq(bills.status, status));
  }
  const trimmed = q.trim();
  if (trimmed) {
    conditions.push(sql`instr(lower(${bills.billNumber}), lower(${trimmed})) > 0`);
  }
  const whereClause = and(...conditions);

  const [countRow] = await db.select({ n: sql<number>`count(*)` }).from(bills).where(whereClause);
  const total = Number(countRow?.n ?? 0);

  const list = await db
    .select()
    .from(bills)
    .where(whereClause)
    .orderBy(desc(bills.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  if (list.length === 0) {
    return { rows: list, total, lineQtyByBillId: new Map<number, number>() };
  }

  const ids = list.map((b) => b.id);
  const qtyRows = await db
    .select({
      billId: billLines.billId,
      qty: sql<number>`sum(${billLines.qty})`,
    })
    .from(billLines)
    .where(inArray(billLines.billId, ids))
    .groupBy(billLines.billId);

  const lineQtyByBillId = new Map(qtyRows.map((r) => [r.billId, Number(r.qty)]));
  return { rows: list, total, lineQtyByBillId };
}

export async function getTables() {
  return db.select().from(diningTables).orderBy(asc(diningTables.name));
}

export async function getInventory() {
  return db.select().from(inventoryItems).orderBy(asc(inventoryItems.name));
}

export async function getDashboardPageData(
  from: Date,
  to: Date,
  opts: { chartBucket: ChartBucket; period: PeriodPreset },
) {
  const { chartBucket, period } = opts;
  const { prevFrom, prevTo } = resolvePreviousComparisonRange(period, from, to);
  const todayHourWindow =
    period === "today" && chartBucket === "hour" ? TODAY_CHART_HOUR_WINDOW : undefined;
  const todayIst = resolvePresetRange("today");

  const [current, previous, itemsSold, prevItemsSold, categories, orderTypes, recentRows] =
    await Promise.all([
      getDashboardStats(from, to, chartBucket),
      getDashboardStats(prevFrom, prevTo, chartBucket),
      getItemsSoldInRange(from, to),
      getItemsSoldInRange(prevFrom, prevTo),
      getCategoryRevenueByRange(from, to),
      getOrderTypeCounts(from, to),
      getRecentBillsForDashboard(20, todayIst.from, todayIst.to),
    ]);

  return {
    from,
    to,
    prevFrom,
    prevTo,
    stats: current.stats,
    prevStats: previous.stats,
    chart: mergeRevenueChart(
      current.chart.map((r) => ({ day: r.day, totalRupee: Number(r.totalRupee) })),
      from,
      to,
      chartBucket,
      todayHourWindow,
    ),
    itemsSold,
    prevItemsSold,
    categories,
    orderTypes,
    recentRows,
  };
}

