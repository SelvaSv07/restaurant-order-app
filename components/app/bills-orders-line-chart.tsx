"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatIstHourBucketLabel } from "@/lib/chart-series";

type Point = { day: string; count: number };

function formatDayLabel(day: string) {
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(day)) {
    return formatIstHourBucketLabel(day);
  }
  const parts = day.split("-").map(Number);
  if (parts.length === 2) {
    const [y, m] = parts;
    if (!y || !m) return day;
    return new Intl.DateTimeFormat("en-IN", { month: "short" }).format(new Date(y, m - 1, 1));
  }
  const [y, m, d] = parts;
  if (!y || !m || !d) return day;
  const date = new Date(y, m - 1, d);
  return new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(date);
}

export function BillsOrdersLineChart({ data }: { data: Point[] }) {
  const chartData = data.map((p) => ({
    ...p,
    label: formatDayLabel(p.day),
  }));

  return (
    <div className="h-[180px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#ebebeb" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#858585" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#858585" }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "none",
              boxShadow: "0 4px 12px rgba(51,51,51,0.08)",
              fontSize: 12,
            }}
            formatter={(value) => [`${value ?? ""}`, "Orders"]}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as (Point & { label: string }) | undefined;
              return row?.day ?? "";
            }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="none"
            fill="url(#billsOrangeGradient)"
            fillOpacity={1}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#ff6b1e"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: "#ff6b1e", stroke: "#fff", strokeWidth: 2 }}
          />
          <defs>
            <linearGradient id="billsOrangeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6b1e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#ff6b1e" stopOpacity={0} />
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
