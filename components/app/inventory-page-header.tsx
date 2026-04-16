"use client";

import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/input";

const searchIcon = "https://www.figma.com/api/mcp/asset/791e41e5-7275-4757-aa76-757081e320da";
const bellIcon = "https://www.figma.com/api/mcp/asset/acf3cb3c-2af4-40d7-81bf-e6538e2222ee";
const gearIcon = "https://www.figma.com/api/mcp/asset/3cd965da-a82b-4e67-b6ed-75fab87b43bf";

export function InventoryPageHeader() {
  return (
    <div className="flex w-full flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-semibold leading-tight text-[#333]">Inventory</h1>
          <p className="text-sm text-[#858585]">Hello, welcome back!</p>
        </div>

        <label className="relative w-full sm:max-w-[307px]">
          <span className="pointer-events-none absolute left-3 top-1/2 flex size-[18px] -translate-y-1/2 items-center justify-center">
            <Image src={searchIcon} alt="" width={18} height={18} className="size-[18px]" unoptimized />
          </span>
          <Input
            readOnly
            placeholder="Search anything"
            className="h-11 rounded-xl border-0 bg-white pl-10 pr-3 text-sm text-[#858585] shadow-sm ring-1 ring-black/[0.06] placeholder:text-[#858585] focus-visible:ring-[#ff6b1e]/40"
          />
        </label>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end xl:w-[277px]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative cursor-pointer rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-black/[0.06] transition hover:bg-neutral-50"
            aria-label="Notifications"
          >
            <Image src={bellIcon} alt="" width={20} height={20} className="size-5" unoptimized />
            <span className="absolute right-1 top-1 size-2 rounded-full bg-[#ff6b1e]" aria-hidden />
          </button>
          <Link
            href="/settings"
            className="cursor-pointer rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-black/[0.06] transition hover:bg-neutral-50"
            aria-label="Settings"
          >
            <Image src={gearIcon} alt="" width={20} height={20} className="size-5" unoptimized />
          </Link>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 text-right">
            <p className="truncate text-sm font-semibold text-[#0c0d19]">Team</p>
            <p className="text-[10px] leading-tight text-[#6d6e75]">Admin</p>
          </div>
          <div className="size-10 shrink-0 rounded-lg bg-[#ff6b1e]" aria-hidden />
        </div>
      </div>
    </div>
  );
}
