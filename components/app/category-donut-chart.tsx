"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatINR } from "@/lib/money";

const COLORS = ["#ff6b1e", "#333333", "#fdcea1", "#b6b6b6", "#6d6e75", "#ebebeb"];

type Row = { name: string; total: number };

export function CategoryDonutChart({ data }: { data: Row[] }) {
  const chartData = data
    .filter((d) => d.total > 0)
    .map((d) => ({ name: d.name, value: d.total }));

  const sumTotal = chartData.reduce((s, d) => s + d.value, 0);

  if (chartData.length === 0 || sumTotal === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-[#858585]">
        No category data for this period.
      </div>
    );
  }

  return (
    <div className="flex min-w-0 w-full items-center gap-4">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width={180} height={180}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={72}
              paddingAngle={2}
              strokeWidth={0}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatINR(Number(value ?? 0))}
              contentStyle={{ borderRadius: 12, border: "1px solid #ebebeb" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="min-w-0 flex-1 space-y-2 text-sm">
        {chartData.map((d, i) => {
          const pct = sumTotal > 0 ? Math.round((d.value / sumTotal) * 100) : 0;
          return (
            <li key={d.name} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-[#858585]">
                <span
                  className="size-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                />
                <span className="truncate">{d.name}</span>
              </span>
              <span className="shrink-0 font-medium tabular-nums text-[#333]">{pct}%</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
