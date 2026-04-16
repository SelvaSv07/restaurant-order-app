"use client";

import { toast } from "sonner";

import { cn } from "@/lib/utils";

/** Testing: no navigation to `/print/*` — only a success toast. */
export function PrintTestToastTrigger({
  children,
  kind,
  className,
}: {
  children: React.ReactNode;
  kind: "bill" | "kot";
  className?: string;
}) {
  return (
    <button
      type="button"
      className={cn(
        "cursor-pointer border-0 bg-transparent p-0 font-inherit text-left shadow-none",
        "focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35",
        className,
      )}
      onClick={() =>
        toast.success(kind === "kot" ? "KOT printed" : "Bill printed", {
          description: "Print preview is off during testing.",
        })
      }
    >
      {children}
    </button>
  );
}
