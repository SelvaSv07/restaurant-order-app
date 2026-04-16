"use client";

import { getCategoryIcon } from "@/lib/category-icons";

export function CategoryLucideIcon({
  name,
  color,
  className,
}: {
  name: string;
  color: string;
  className?: string;
}) {
  const Icon = getCategoryIcon(name);
  return <Icon className={className} style={{ color }} aria-hidden />;
}
