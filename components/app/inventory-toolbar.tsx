"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STOCK_STATUS_LABEL: Record<string, string> = {
  all: "All Status",
  available: "Available",
  low: "Low",
  out: "Out of Stock",
};

export function InventoryToolbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const st = searchParams.get("status") ?? "all";

  function href(next: Record<string, string | null | undefined>) {
    const p = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v === null || v === undefined || v === "") p.delete(k);
      else p.set(k, v);
    }
    const s = p.toString();
    return s ? `${pathname}?${s}` : pathname;
  }

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end lg:gap-8">
      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2.5">
        <form
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[10px] bg-[#f7f7f7] px-3 py-2 sm:max-w-[237px] sm:flex-initial"
          action={pathname}
          method="get"
        >
          {st !== "all" ? <input type="hidden" name="status" value={st} /> : null}
          <Search className="size-4 shrink-0 text-[#858585]" aria-hidden />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search for item"
            className="min-w-0 flex-1 bg-transparent text-xs text-[#333] outline-none placeholder:text-[#858585]"
          />
        </form>

        <div className="inline-flex items-center rounded-[10px] px-0.5 py-2 text-xs font-medium text-[#333]">
          <span className="sr-only">Status</span>
          <Select
            value={st}
            onValueChange={(v) => {
              if (v == null) return;
              router.push(
                href({
                  status: v === "all" ? null : v,
                  page: null,
                }),
              );
            }}
          >
            <SelectTrigger
              className="h-8 border-0 bg-transparent px-2.5 py-1 shadow-none ring-0 focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
              size="sm"
            >
              <SelectValue>{STOCK_STATUS_LABEL[st] ?? st}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">{STOCK_STATUS_LABEL.all}</SelectItem>
              <SelectItem value="available">{STOCK_STATUS_LABEL.available}</SelectItem>
              <SelectItem value="low">{STOCK_STATUS_LABEL.low}</SelectItem>
              <SelectItem value="out">{STOCK_STATUS_LABEL.out}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
