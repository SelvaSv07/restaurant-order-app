import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardPanelProps = {
  title: string;
  /** Shown inline immediately to the right of the title (e.g. selected period). */
  titleAddon?: ReactNode;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function DashboardPanel({
  title,
  titleAddon,
  subtitle,
  action,
  className,
  children,
}: DashboardPanelProps) {
  return (
    <div
      className={cn(
        "rounded-xl bg-white p-4 shadow-[0_4px_24px_rgba(51,51,51,0.06)] ring-1 ring-[#ebebeb]",
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-0.5">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
            <h2 className="text-lg font-semibold leading-tight text-[#333]">{title}</h2>
            {titleAddon ? (
              <span className="text-sm font-medium whitespace-nowrap text-[#858585]">{titleAddon}</span>
            ) : null}
          </div>
          {subtitle ? <p className="text-sm text-[#858585]">{subtitle}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </div>
  );
}
