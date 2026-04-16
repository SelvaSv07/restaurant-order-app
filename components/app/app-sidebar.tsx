"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

import { SidebarPromo } from "@/components/app/sidebar-promo";
import { SidebarNav } from "@/components/sidebar-nav";

const logoSymbol = "https://www.figma.com/api/mcp/asset/712fbe8e-e10c-41ba-9b1d-9b770192e8be";

export function AppSidebar() {
  return (
    <aside className="flex min-h-screen w-[221px] shrink-0 flex-col border-r border-[#ebebeb] bg-[#fdfdfd] px-5 pb-5 pt-6">
      <div className="px-3 pb-8">
        <Link href="/dashboard" className="flex cursor-pointer items-center gap-2">
          <span className="relative size-6 shrink-0">
            <Image
              src={logoSymbol}
              alt="Reztro"
              width={24}
              height={24}
              className="size-6"
              unoptimized
            />
          </span>
          <span className="text-2xl font-semibold tracking-tight text-[#333]">Reztro</span>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-8">
        <div className="min-h-0 flex-1">
          <SidebarNav />
        </div>
        <SidebarPromo />
        <Link
          href="/settings"
          className="flex cursor-pointer items-center gap-2 px-1 text-sm font-medium text-[#858585] transition hover:text-[#333]"
        >
          <Settings className="size-[22px]" strokeWidth={2} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
