import { BillsOrderTypesDonut } from "@/components/app/bills-order-types-donut";
import { BillsOrdersLineChart } from "@/components/app/bills-orders-line-chart";
import { BillsStatsCards } from "@/components/app/bills-stats-cards";

type DayPoint = { day: string; count: number };

export function BillsAnalyticsSection({
  stats,
  chart,
  orderTypes,
  periodLabel,
}: {
  stats: { total: number; draft: number; completed: number; voided: number };
  chart: DayPoint[];
  orderTypes: { dineIn: number; takeaway: number };
  periodLabel: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,293px)_minmax(0,1fr)_minmax(0,374px)]">
        <BillsStatsCards
          total={stats.total}
          onProcess={stats.draft}
          completed={stats.completed}
          canceled={stats.voided}
        />
        <div className="flex min-h-[264px] flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#333]">Orders overview</h2>
            <span className="inline-flex items-center gap-0.5 rounded-[10px] px-0.5 py-2 text-xs font-medium text-[#333]">
              {periodLabel}
            </span>
          </div>
          <BillsOrdersLineChart data={chart} />
        </div>
        <div className="flex min-h-[264px] flex-col gap-4 rounded-xl bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold text-[#333]">Order types</h2>
            <span className="inline-flex items-center gap-0.5 rounded-[10px] px-0.5 py-2 text-xs font-medium text-[#333]">
              {periodLabel}
            </span>
          </div>
          <BillsOrderTypesDonut dineIn={orderTypes.dineIn} takeaway={orderTypes.takeaway} />
        </div>
      </div>
    </div>
  );
}
