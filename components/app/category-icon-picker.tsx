"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CategoryLucideIcon } from "@/components/category-lucide-icon";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CATEGORY_ICON_KEYS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

const triggerClass =
  "flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border-0 bg-[#f7f7f7] px-3 text-left shadow-none ring-1 ring-[#ebebeb] transition-colors hover:bg-[#f0f0f0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35";

export function CategoryIconPicker({
  id,
  value,
  onChange,
  accentColor,
}: {
  id: string;
  value: string;
  onChange: (key: string) => void;
  accentColor: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger type="button" id={id} className={triggerClass}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#ebebeb]/60">
          <CategoryLucideIcon name={value} color={accentColor} className="size-5" />
        </span>
        <ChevronDown className="size-4 shrink-0 text-[#858585]" aria-hidden />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="z-[100] w-[min(100vw-2rem,280px)] border-0 bg-white p-3 shadow-[0_4px_24px_rgba(51,51,51,0.12)] ring-1 ring-[#ebebeb]"
        sideOffset={6}
      >
        <div className="grid grid-cols-5 gap-1.5">
          {CATEGORY_ICON_KEYS.map((key) => {
            const selected = key === value;
            return (
              <button
                key={key}
                type="button"
                aria-label={`Select ${key} icon`}
                onClick={() => {
                  onChange(key);
                  setOpen(false);
                }}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-xl transition-colors",
                  "ring-1 ring-transparent hover:bg-[#fffaf6] hover:ring-[#ff6b1e]/25",
                  selected && "bg-[#fffaf6] ring-2 ring-[#ff6b1e]/50",
                )}
              >
                <CategoryLucideIcon name={key} color={accentColor} className="size-6" />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
