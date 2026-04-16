import Link from "next/link";
import { BillsSearch } from "@/components/app/bills-search";

export function BillsPageHeader({ searchQuery }: { searchQuery: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold leading-tight text-[#333]">Bills</h1>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs leading-relaxed">
          <Link href="/dashboard" className="font-medium text-[#ff6b1e] hover:underline">
            Dashboard
          </Link>
          <span className="text-[#b6b6b6]">/</span>
          <span className="text-[#858585]">Orders</span>
        </div>
      </div>
      <BillsSearch initialQuery={searchQuery} />
    </div>
  );
}
