"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { month: string; value: number };

export function InventorySupplyOverview({
  totalUnits,
  series,
}: {
  totalUnits: number;
  series: Point[];
}) {
  const max = Math.max(320, ...series.map((p) => p.value), 1);
  const ticks = [0, Math.round(max * 0.25), Math.round(max * 0.5), Math.round(max * 0.75), max];

  return (
    <div className="flex w-full min-w-0 flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/[0.06]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#858585]">Supply Overview</p>
          <p className="text-[22px] font-semibold leading-tight text-[#333]">
            {totalUnits.toLocaleString("en-IN")}
          </p>
        </div>
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-0.5 rounded-[10px] px-0.5 py-2 text-xs font-medium text-[#333]"
        >
          Last 8 Months
          <span className="inline-flex size-[14px] items-center justify-center text-[#333]" aria-hidden>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path
                d="M3.5 5.25L7 8.75L10.5 5.25"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </button>
      </div>
      <div className="h-[180px] w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke="#ebebeb" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: "#858585", fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis
              domain={[0, max]}
              ticks={ticks}
              tick={{ fill: "#858585", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={36}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "none",
                boxShadow: "0 4px 12px rgba(51,51,51,0.08)",
                fontSize: 12,
              }}
              formatter={(value) => [`${value ?? 0} Products`, ""]}
              labelFormatter={(label) => String(label)}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#ff6b1e"
              strokeWidth={2}
              fill="#ff6b1e"
              fillOpacity={0.12}
              dot={{ fill: "#ff6b1e", strokeWidth: 0, r: 4 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
