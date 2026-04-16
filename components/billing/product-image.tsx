"use client";

import { useState } from "react";

import { CategoryLucideIcon } from "@/components/category-lucide-icon";

type Props = {
  src: string | null;
  alt: string;
  iconKey: string;
  iconColor: string;
  className?: string;
};

export function ProductImage({ src, alt, iconKey, iconColor, className }: Props) {
  const [failed, setFailed] = useState(!src);

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center ${className ?? ""}`}
        style={{ backgroundColor: `${iconColor}22` }}
      >
        <CategoryLucideIcon name={iconKey} color={iconColor} className="size-14" />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- user uploads from /public
    <img
      src={src}
      alt={alt}
      className={`object-cover ${className ?? ""}`}
      onError={() => setFailed(true)}
    />
  );
}
