import { ShoppingBag, UtensilsCrossed } from "lucide-react";

type OrderTypesPanelProps = {
  dineIn: number;
  takeaway: number;
};

export function OrderTypesPanel({ dineIn, takeaway }: OrderTypesPanelProps) {
  const total = dineIn + takeaway;
  const rows = [
    {
      label: "Dine-In",
      count: dineIn,
      pct: total > 0 ? (dineIn / total) * 100 : 0,
      icon: UtensilsCrossed,
    },
    {
      label: "Takeaway",
      count: takeaway,
      pct: total > 0 ? (takeaway / total) * 100 : 0,
      icon: ShoppingBag,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => {
        const Icon = row.icon;
        return (
          <div key={row.label} className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 font-medium text-[#333]">
                <Icon className="size-4 text-[#858585]" strokeWidth={2} />
                {row.label}
              </span>
              <span className="tabular-nums text-[#858585]">
                {row.count} ({Math.round(row.pct)}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#f7f7f7]">
              <div
                className="h-full rounded-full bg-[#ff6b1e] transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, row.pct))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
