"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { formatIstHourBucketLabel } from "@/lib/chart-series";

function shortDayLabel(d: string) {
  if (/^\d{4}-\d{2}$/.test(d)) {
    const [y, m] = d.split("-").map(Number);
    return new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(y, m - 1, 1));
  }
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(d)) {
    return formatIstHourBucketLabel(d);
  }
  const t = Date.parse(d);
  if (!Number.isFinite(t)) return d.length <= 3 ? d : d.slice(5);
  return new Intl.DateTimeFormat("en", { weekday: "short" }).format(new Date(t));
}

type Point = { day: string; count: number };

export function OrdersBarChart({ data }: { data: Point[] }) {
  const rows = data.map((p) => ({ ...p, label: shortDayLabel(p.day) }));
  const max = Math.max(0, ...rows.map((d) => d.count));

  if (rows.length === 0) {
    return (
      <div className="flex h-[190px] items-center justify-center text-sm text-[#858585]">
        No order data for this period.
      </div>
    );
  }

  return (
    <div className="h-[190px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#f0f0f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "#858585", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            cursor={{ fill: "rgba(255,107,30,0.06)" }}
            formatter={(value) => [`${value ?? 0}`, "orders"]}
            labelFormatter={(_label, payload) => {
              const row = payload?.[0]?.payload as (Point & { label?: string }) | undefined;
              return row?.day ?? "";
            }}
            contentStyle={{
              borderRadius: 8,
              border: "none",
              boxShadow: "0 4px 12px rgba(51,51,51,0.08)",
              fontSize: 12,
            }}
          />
          <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={40}>
            {rows.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.count === max && max > 0 ? "#ff6b1e" : "#ffeee0"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
