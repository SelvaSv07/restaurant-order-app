import { IndianRupee, Package, Receipt } from "lucide-react";

import { CategoryDonutChart } from "@/components/app/category-donut-chart";
import { DashboardHeader } from "@/components/app/dashboard-header";
import { DashboardPanel } from "@/components/app/dashboard-panel";
import { OrderTypesPanel } from "@/components/app/order-types-panel";
import { RecentOrdersTable } from "@/components/app/recent-orders-table";
import { RevenueChart } from "@/components/app/revenue-chart";
import { StatCard } from "@/components/app/stat-card";
import { pctChange } from "@/lib/dashboard-trends";
import {
  chartBucketForPreset,
  resolveCustomRange,
  resolvePresetRange,
  type PeriodPreset,
} from "@/lib/ist";
import { formatINR } from "@/lib/money";
import { getDashboardPageData } from "@/lib/repository";

type Search = {
  period?: PeriodPreset;
  from?: string;
  to?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Search> }) {
  const params = await searchParams;
  const period = params.period ?? "today";
  const range =
    period === "custom" && params.from && params.to
      ? resolveCustomRange(params.from, params.to)
      : resolvePresetRange(period === "custom" ? "today" : period);

  const chartBucket = period === "custom" ? "day" : chartBucketForPreset(period);
  const data = await getDashboardPageData(range.from, range.to, { chartBucket, period });

  const revenue = data.stats?.totalRupee ?? 0;
  const prevRevenue = data.prevStats?.totalRupee ?? 0;
  const orders = data.stats?.billCount ?? 0;
  const prevOrders = data.prevStats?.billCount ?? 0;

  const periodLabel =
    period === "custom"
      ? `Selected range · ${data.chart.length} ${chartBucket === "month" ? "months" : "days"}`
      : period === "today"
        ? "Today · full day"
        : period === "week"
          ? `Past 7 days · ${data.chart.length} days`
          : period === "month"
            ? `This month · ${data.chart.length} days`
            : `This year · ${data.chart.length} months`;

  return (
    <div className="flex flex-col gap-8">
      <DashboardHeader />

      <div className="min-w-0 space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total Orders"
            value={orders.toLocaleString("en-IN")}
            icon={Receipt}
            trendPct={pctChange(orders, prevOrders)}
          />
          <StatCard
            label="Items sold"
            value={data.itemsSold.toLocaleString("en-IN")}
            icon={Package}
            trendPct={pctChange(data.itemsSold, data.prevItemsSold)}
          />
          <StatCard
            label="Total Revenue"
            value={formatINR(revenue)}
            icon={IndianRupee}
            trendPct={pctChange(revenue, prevRevenue)}
          />
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <DashboardPanel
            title="Total Revenue"
            titleAddon={periodLabel}
            subtitle="Selected period · completed bills only (drafts excluded)"
          >
            <RevenueChart data={data.chart} chartBucket={chartBucket} />
          </DashboardPanel>
          <div className="grid min-w-0 gap-6 md:grid-cols-2">
            <DashboardPanel title="Top Categories" subtitle="Share of sales by category">
              <CategoryDonutChart data={data.categories} />
            </DashboardPanel>
            <DashboardPanel title="Order Types" subtitle="Channel mix">
              <OrderTypesPanel dineIn={data.orderTypes.dineIn} takeaway={data.orderTypes.takeaway} />
            </DashboardPanel>
          </div>
        </div>

        <DashboardPanel title="Recent Orders" subtitle="Latest activity across the restaurant">
          <RecentOrdersTable rows={data.recentRows} />
        </DashboardPanel>
      </div>
    </div>
  );
}
