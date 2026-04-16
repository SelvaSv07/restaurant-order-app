import Link from "next/link";
import { Building2, FolderTree, LayoutGrid, Package, Printer, Settings2 } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const sections = [
  {
    href: "/settings/products",
    title: "Products",
    description: "Manage menu items, prices, and photos.",
    icon: Package,
  },
  {
    href: "/settings/categories",
    title: "Categories",
    description: "Organize products with icons and colors.",
    icon: FolderTree,
  },
  {
    href: "/settings/tables",
    title: "Tables",
    description: "Dining tables for Dine-in billing.",
    icon: LayoutGrid,
  },
  {
    href: "/settings/business",
    title: "Business",
    description: "Shop name, contact, address, and GST details.",
    icon: Building2,
  },
  {
    href: "/settings/other",
    title: "Other settings",
    description: "Receipt printer header, footer, and paper width.",
    icon: Printer,
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-[#ffeee0] text-[#ff6b1e]">
          <Settings2 className="size-5" strokeWidth={2} />
        </span>
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Settings</h1>
          <p className="text-sm text-[#858585]">Choose what you want to configure.</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href} className="block cursor-pointer outline-none">
              <Card className="h-full border-[#ebebeb] bg-white transition hover:border-[#ff6b1e]/40 hover:shadow-sm">
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f9f4ef] text-[#ff6b1e]">
                      <Icon className="size-5" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                      <CardTitle className="text-base text-[#333]">{section.title}</CardTitle>
                      <CardDescription className="mt-1 text-[13px] leading-snug text-[#858585]">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <span className="text-sm font-medium text-[#ff6b1e]">Open →</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
