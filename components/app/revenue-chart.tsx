"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartBucket } from "@/lib/chart-series";
import { formatIstHourBucketLabel } from "@/lib/chart-series";
import { formatINR } from "@/lib/money";

type Point = { day: string; totalRupee: number };

function formatDayTick(d: string) {
  if (/^\d{4}-\d{2}$/.test(d)) {
    const [y, m] = d.split("-").map(Number);
    return new Intl.DateTimeFormat("en-IN", { month: "short", year: "2-digit" }).format(
      new Date(y, m - 1, 1),
    );
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(d)) {
    return formatIstHourBucketLabel(d);
  }
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return d;
  return new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(t));
}

export function RevenueChart({
  data,
}: {
  data: Point[];
  /** Accepted for API compatibility with the dashboard page; visuals match master admin. */
  chartBucket?: ChartBucket;
}) {
  const chartData = data.map((d) => ({
    label: formatDayTick(d.day),
    revenue: d.totalRupee,
    revenueLabel: formatINR(d.totalRupee),
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ left: 8, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ebebeb" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <Tooltip
            formatter={(value) => [formatINR(Number(value ?? 0)), "Revenue"]}
            labelFormatter={(label) => String(label)}
            contentStyle={{ borderRadius: 12, border: "1px solid #ebebeb" }}
          />
          <Bar dataKey="revenue" fill="#ff6b1e" radius={[8, 8, 0, 0]} maxBarSize={56} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
