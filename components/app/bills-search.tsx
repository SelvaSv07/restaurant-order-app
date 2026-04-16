"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";

export function BillsSearch({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(initialQuery);

  useEffect(() => {
    setValue(initialQuery);
  }, [initialQuery]);

  const push = useCallback(
    (next: string) => {
      const search = new URLSearchParams(params.toString());
      if (next.trim()) search.set("q", next.trim());
      else search.delete("q");
      search.delete("page");
      router.push(`${pathname}?${search.toString()}`);
    },
    [params, pathname, router],
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (value.trim() === initialQuery.trim()) return;
      push(value);
    }, 350);
    return () => clearTimeout(t);
  }, [value, initialQuery, push]);

  return (
    <div className="flex w-full max-w-full flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-[0_4px_24px_rgba(51,51,51,0.06)] ring-1 ring-[#ebebeb] sm:max-w-[min(100%,480px)]">
      <Search className="size-[18px] shrink-0 text-[#858585]" strokeWidth={1.75} />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search order ID, bill number…"
        className="h-auto min-w-0 flex-1 border-0 bg-transparent p-0 text-sm text-[#333] shadow-none placeholder:text-[#858585] focus-visible:ring-0"
      />
    </div>
  );
}
