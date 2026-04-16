"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus, Search } from "lucide-react";

import { AddInventoryProductDialog } from "@/components/app/add-inventory-product-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Props = {
  categories: string[];
};

export function InventoryToolbar({ categories }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") ?? "inventory";
  const q = searchParams.get("q") ?? "";
  const cat = searchParams.get("category") ?? "all";
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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
      <div className="flex shrink-0 items-start">
        <div className="inline-flex gap-0.5 rounded-[10px] bg-[#f7f7f7] p-0.5">
          <Link
            href={href({ tab: null })}
            className={cn(
              "rounded-[10px] px-4 py-1 text-xs font-semibold transition",
              tab !== "purchase" ? "bg-[#ff6b1e] text-white" : "bg-transparent font-medium text-[#858585]",
            )}
          >
            Inventory
          </Link>
          <Link
            href={href({ tab: "purchase" })}
            className={cn(
              "rounded-[10px] px-4 py-1 text-xs transition",
              tab === "purchase" ? "bg-[#ff6b1e] font-semibold text-white" : "font-medium text-[#858585]",
            )}
          >
            Purchase Order
          </Link>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2.5">
        <form
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-[10px] bg-[#f7f7f7] px-3 py-2 sm:max-w-[237px] sm:flex-initial"
          action={pathname}
          method="get"
        >
          {tab === "purchase" ? <input type="hidden" name="tab" value="purchase" /> : null}
          {cat !== "all" ? <input type="hidden" name="category" value={cat} /> : null}
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
          <span className="sr-only">Category</span>
          <Select
            value={cat}
            onValueChange={(v) => {
              if (v == null) return;
              router.push(
                href({
                  category: v === "all" ? null : v,
                  page: null,
                }),
              );
            }}
          >
            <SelectTrigger
              className="h-8 max-w-[140px] border-0 bg-transparent px-2.5 py-1 shadow-none ring-0 focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35"
              size="sm"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Category</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="out">Out of Stock</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {tab !== "purchase" ? <AddInventoryProductDialog /> : null}
      </div>
    </div>
  );
}
