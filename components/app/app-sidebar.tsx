"use client";

import Image from "next/image";
import Link from "next/link";
import { Settings } from "lucide-react";

import { SidebarNav } from "@/components/sidebar-nav";

export function AppSidebar() {
  return (
    <aside className="sticky top-0 flex h-dvh w-[241px] shrink-0 flex-col overflow-hidden border-r border-[#ebebeb] bg-[#fdfdfd] px-5 pb-5 pt-6">
      <div className="shrink-0 px-3 pb-6">
        <Link
          href="/dashboard"
          className="flex min-w-0 w-full cursor-pointer items-center gap-2.5 rounded-full bg-black px-3 py-2 shadow-sm transition hover:bg-neutral-900"
        >
          <Image
            src="/stark_hub_logo.webp"
            alt=""
            width={32}
            height={32}
            className="size-7 shrink-0 object-contain"
            priority
          />
          <span className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-white">
            Starkhub
          </span>
        </Link>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto">
        <div className="min-h-0 flex-1">
          <SidebarNav />
        </div>
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
