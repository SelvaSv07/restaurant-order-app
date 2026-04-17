import { BillsAnalyticsSection } from "@/components/app/bills-analytics-section";
import { BillsHeader } from "@/components/app/bills-header";
import { BillsRecentOrders, type BillsStatusTab } from "@/components/app/bills-recent-orders";
import { type PeriodPreset, resolveCustomRange, resolvePresetRange, toDateInput } from "@/lib/ist";
import {
  getBillStatusCounts,
  getBillsListPage,
  getOrderTypeCounts,
  type BillsListStatus,
} from "@/lib/repository";

const PAGE_SIZE = 20;

type Search = {
  period?: PeriodPreset;
  from?: string;
  to?: string;
  status?: string;
  q?: string;
  page?: string;
};

function periodLabel(period: PeriodPreset, from: Date, to: Date): string {
  if (period === "custom") {
    return `${toDateInput(from)} – ${toDateInput(to)}`;
  }
  const map: Record<Exclude<PeriodPreset, "custom">, string> = {
    today: "Today",
    week: "This Week",
    month: "This Month",
    year: "This Year",
  };
  return map[period];
}

function parseStatus(raw: string | undefined): BillsStatusTab {
  if (raw === "draft" || raw === "completed" || raw === "voided") return raw;
  return "all";
}

function buildBaseSearchParams(
  period: PeriodPreset,
  fromInput: string | undefined,
  toInput: string | undefined,
  q: string,
): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set("period", period);
  if (period === "custom" && fromInput && toInput) {
    sp.set("from", fromInput);
    sp.set("to", toInput);
  }
  if (q.trim()) sp.set("q", q.trim());
  return sp;
}

function buildPaginationItems(page: number, totalPages: number, base: URLSearchParams) {
  const href = (p: number) => {
    const qs = new URLSearchParams(base.toString());
    if (p <= 1) qs.delete("page");
    else qs.set("page", String(p));
    return `/bills?${qs.toString()}`;
  };

  const items: {
    type: "page" | "ellipsis";
    value?: number;
    href?: string;
    active?: boolean;
  }[] = [];

  if (totalPages <= 1) {
    return { prev: null as string | null, next: null as string | null, items };
  }

  const pages: number[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    const left = Math.max(2, page - 1);
    const right = Math.min(totalPages - 1, page + 1);
    if (left > 2) pages.push(-1);
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push(-1);
    pages.push(totalPages);
  }

  for (const p of pages) {
    if (p === -1) items.push({ type: "ellipsis" });
    else items.push({ type: "page", value: p, href: href(p), active: p === page });
  }

  return {
    prev: page > 1 ? href(page - 1) : null,
    next: page < totalPages ? href(page + 1) : null,
    items,
  };
}

export default async function BillsPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const period = params.period ?? "today";
  const range =
    period === "custom" && params.from && params.to
      ? resolveCustomRange(params.from, params.to)
      : resolvePresetRange(period === "custom" ? "today" : period);

  const status = parseStatus(params.status);
  const listStatus: BillsListStatus = status;
  const q = params.q ?? "";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  function tabHref(next: BillsStatusTab) {
    const s = buildBaseSearchParams(period, params.from, params.to, q);
    if (next === "all") s.delete("status");
    else s.set("status", next);
    s.delete("page");
    return `/bills?${s.toString()}`;
  }

  const tabLinks: Record<BillsStatusTab, string> = {
    all: tabHref("all"),
    draft: tabHref("draft"),
    completed: tabHref("completed"),
    voided: tabHref("voided"),
  };

  const [stats, orderTypes, listFirst] = await Promise.all([
    getBillStatusCounts(range.from, range.to),
    getOrderTypeCounts(range.from, range.to),
    getBillsListPage({
      from: range.from,
      to: range.to,
      status: listStatus,
      q,
      page,
      pageSize: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(listFirst.total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const listResult =
    safePage === page
      ? listFirst
      : await getBillsListPage({
          from: range.from,
          to: range.to,
          status: listStatus,
          q,
          page: safePage,
          pageSize: PAGE_SIZE,
        });

  const base = buildBaseSearchParams(period, params.from, params.to, q);
  if (status !== "all") base.set("status", status);

  const pagination = buildPaginationItems(safePage, totalPages, base);

  return (
    <div className="flex flex-col gap-8">
      <BillsHeader />
      <div className="min-w-0 space-y-6">
        <BillsAnalyticsSection
          stats={stats}
          orderTypes={orderTypes}
          periodLabel={periodLabel(period, range.from, range.to)}
        />
        <BillsRecentOrders
          rows={listResult.rows}
          lineQtyByBillId={listResult.lineQtyByBillId}
          total={listResult.total}
          page={safePage}
          pageSize={PAGE_SIZE}
          status={status}
          tabLinks={tabLinks}
          pagination={pagination}
        />
      </div>
    </div>
  );
}
