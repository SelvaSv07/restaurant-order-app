"use client";

import Link from "next/link";
import { ClipboardList, LayoutGrid, Package2, ReceiptText, Table } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const links: {
  href: string;
  label: string;
  icon: LucideIcon;
  suffix?: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { href: "/billing", label: "Billing", icon: ReceiptText },
  { href: "/dine-in", label: "Dine-in", icon: Table },
  { href: "/inventory", label: "Inventory", icon: Package2 },
  { href: "/bills", label: "Bills", icon: ClipboardList },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2">
      {links.map((link) => {
        const Icon = link.icon;
        const Suffix = link.suffix;
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex w-full cursor-pointer items-center gap-2 rounded-xl transition-colors",
              active ? "text-[#ff6b1e]" : "text-[#858585] hover:bg-black/[0.03]",
            )}
          >
            {active ? (
              <>
                <span
                  className="h-6 w-1 shrink-0 rounded-full bg-[#ff6b1e]"
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 items-center gap-2 rounded-xl bg-[#ffeee0] px-2 py-2.5">
                  <Icon className="size-6 shrink-0" strokeWidth={2} />
                  <span className="text-sm font-semibold leading-none">{link.label}</span>
                  {Suffix ? <Suffix className="ml-auto size-3.5 shrink-0 opacity-70" /> : null}
                </span>
              </>
            ) : (
              <span className="flex w-full items-center gap-2 px-4 py-2.5">
                <Icon className="size-6 shrink-0" strokeWidth={2} />
                <span className="text-sm font-medium leading-none">{link.label}</span>
                {Suffix ? <Suffix className="ml-auto size-3.5 shrink-0 opacity-70" /> : null}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
