"use client";

import { createElement } from "react";

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
  return createElement(getCategoryIcon(name), {
    className,
    style: { color },
    "aria-hidden": true,
  });
}
