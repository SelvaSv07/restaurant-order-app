"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

function dineInQueryHref(
  pathname: string,
  tableId: number,
  categoryRaw: string,
  q: string,
) {
  const sp = new URLSearchParams();
  sp.set("tableId", String(tableId));
  if (categoryRaw && categoryRaw !== "all") sp.set("category", categoryRaw);
  const trimmed = q.trim();
  if (trimmed) sp.set("q", trimmed);
  const s = sp.toString();
  return s ? `${pathname}?${s}` : pathname;
}

export function DineInProductSearch({
  tableId,
  categoryRaw,
}: {
  tableId: number;
  categoryRaw: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";

  const [value, setValue] = useState(qFromUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(qFromUrl);
  }, [qFromUrl]);

  const navigate = useCallback(
    (nextQ: string) => {
      const href = dineInQueryHref(pathname, tableId, categoryRaw, nextQ);
      router.replace(href, { scroll: false });
    },
    [pathname, router, tableId, categoryRaw],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
          debounceRef.current = null;
        }
        navigate(value);
      }}
    >
      <label className="flex w-full min-w-0 items-center gap-2 rounded-full border border-[#d6d6d6] bg-white px-4 py-2.5 shadow-sm">
        <Search className="size-4 shrink-0 text-[#7a7a7a]" aria-hidden />
        <input
          name="q"
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            setValue(v);
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
              debounceRef.current = null;
              navigate(v);
            }, 350);
          }}
          placeholder="Search products…"
          className="min-w-0 flex-1 bg-transparent text-sm font-medium text-[#454545] outline-none placeholder:text-[#b0b0b0]"
          autoComplete="off"
          enterKeyHint="search"
        />
      </label>
    </form>
  );
}
