"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
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

/** ~11 ticks (0 … top) for denser horizontal grid lines. */
function revenueYAxisConfig(points: Point[]): { domain: [number, number]; ticks: number[] } {
  const maxRupee = Math.max(0, ...points.map((p) => p.totalRupee));
  if (maxRupee <= 0) {
    const top = 100;
    const segments = 10;
    const ticks = Array.from({ length: segments + 1 }, (_, i) => Math.round((top * i) / segments));
    return { domain: [0, top], ticks };
  }
  const padded = maxRupee * 1.12;
  const top = Math.max(20, Math.ceil(padded / 20) * 20);
  const segments = 10;
  const ticks = Array.from({ length: segments + 1 }, (_, i) => Math.round((top * i) / segments));
  return { domain: [0, top], ticks };
}

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
  chartBucket,
}: {
  data: Point[];
  chartBucket?: ChartBucket;
}) {
  const isHourly = chartBucket === "hour";
  const yAxis = useMemo(() => revenueYAxisConfig(data), [data]);

  return (
    <div className="w-full">
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {isHourly ? (
            <BarChart
              data={data}
              margin={{ top: 4, right: 2, left: -18, bottom: 0 }}
              barCategoryGap="10%"
            >
              <CartesianGrid stroke="#ebebeb" strokeDasharray="3 3" vertical horizontal />
              <XAxis
                dataKey="day"
                tickFormatter={formatDayTick}
                interval={0}
                angle={0}
                textAnchor="middle"
                height={18}
                tickMargin={4}
                tick={{ fill: "#858585", fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                tickFormatter={(value) => formatINR(Number(value))}
                tick={{ fill: "#858585", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                formatter={(value) => [formatINR(Number(value ?? 0)), "Revenue"]}
                labelFormatter={(label) => formatDayTick(String(label))}
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(51,51,51,0.08)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="totalRupee" name="Revenue" fill="#ff6b1e" radius={[6, 6, 0, 0]} maxBarSize={44} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke="#ebebeb" strokeDasharray="3 3" />
              <XAxis
                dataKey="day"
                tickFormatter={formatDayTick}
                interval="preserveStartEnd"
                tick={{ fill: "#858585", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={yAxis.domain}
                ticks={yAxis.ticks}
                tickFormatter={(value) => formatINR(Number(value))}
                tick={{ fill: "#858585", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={52}
              />
              <Tooltip
                formatter={(value) => formatINR(Number(value ?? 0))}
                labelFormatter={(label) => formatDayTick(String(label))}
                contentStyle={{
                  borderRadius: 8,
                  border: "none",
                  boxShadow: "0 4px 12px rgba(51,51,51,0.08)",
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="totalRupee"
                stroke="#ff6b1e"
                fill="#ff6b1e"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
