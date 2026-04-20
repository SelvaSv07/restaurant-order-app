"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  ClipboardList,
  CookingPot,
  Package2,
  ReceiptText,
  Settings,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/billing", label: "Billing", icon: ReceiptText },
  { href: "/dine-in", label: "Dine-in", icon: CookingPot },
  { href: "/inventory", label: "Inventory", icon: Package2 },
  { href: "/bills", label: "Bills", icon: ClipboardList },
];

export function CafeSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-screen w-[237px] shrink-0 flex-col border-r border-[#d6d6d6] bg-white">
      <div className="flex flex-col gap-6 px-5 pb-6 pt-6">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/stark_hub_logo.webp"
            alt="Starkhub"
            width={180}
            height={44}
            className="h-10 w-auto max-w-[200px] object-contain object-left"
            priority
          />
        </Link>
        <div className="h-px w-full bg-[#d6d6d6]" />
      </div>
      <nav className="flex flex-col gap-9 px-5">
        {links.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-2.5 text-[15px] font-medium transition-colors",
                active
                  ? "bg-[#f97316] text-white shadow-sm"
                  : "text-[#7a7a7a] hover:bg-black/[0.04] hover:text-[#454545]",
              )}
            >
              <Icon className="size-[22px] shrink-0" strokeWidth={2} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-9 px-6 pb-10 pt-8">
        <Link
          href="/settings"
          className="flex items-center gap-2.5 text-[15px] font-medium text-[#7a7a7a] hover:text-[#454545]"
        >
          <Settings className="size-[22px]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
