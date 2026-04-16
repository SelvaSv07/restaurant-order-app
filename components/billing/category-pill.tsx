import Link from "next/link";

import { CategoryLucideIcon } from "@/components/category-lucide-icon";
import { cn } from "@/lib/utils";

export function CategoryPill({
  href,
  active,
  label,
  iconKey,
  iconColor,
}: {
  href: string;
  active: boolean;
  label: string;
  iconKey: string;
  iconColor: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors sm:px-6 sm:text-base",
        active ? "bg-[#f97316] text-white shadow-sm" : "bg-white text-[#7a7a7a] shadow-sm ring-1 ring-black/[0.06] hover:bg-white/90",
      )}
    >
      <CategoryLucideIcon
        name={iconKey}
        color={active ? "#ffffff" : iconColor}
        className="size-4 shrink-0"
      />
      {label}
    </Link>
  );
}
