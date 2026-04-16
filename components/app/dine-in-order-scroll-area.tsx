"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Scroll area for the dine-in order list with a bottom fade + “More below” hint when
 * content extends past the viewport and the user has not scrolled to the end.
 */
export function DineInOrderScrollArea({ children, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [moreBelow, setMoreBelow] = useState(false);

  const update = useCallback(() => {
    const root = rootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;
    const { scrollTop, clientHeight, scrollHeight } = viewport;
    const hasOverflow = scrollHeight > clientHeight + 2;
    const notAtBottom = scrollTop + clientHeight < scrollHeight - 8;
    setMoreBelow(hasOverflow && notAtBottom);
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const viewport = root.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]');
    if (!viewport) return;

    viewport.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(viewport);
    const inner = viewport.firstElementChild;
    if (inner) ro.observe(inner);

    const t = window.requestAnimationFrame(update);

    return () => {
      window.cancelAnimationFrame(t);
      viewport.removeEventListener("scroll", update);
      ro.disconnect();
    };
  }, [update, children]);

  return (
    <div
      ref={rootRef}
      className={cn("relative mt-3 flex min-h-0 flex-1 flex-col overflow-hidden", className)}
    >
      <ScrollArea className="min-h-0 flex-1 overflow-hidden pr-1">
        {children}
      </ScrollArea>

      {moreBelow ? (
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-2.5 z-10 flex h-16 items-end justify-center bg-gradient-to-t from-white from-35% via-white/85 via-55% to-transparent pb-1.5 pt-8"
          aria-hidden
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-[#fafafa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#7a7a7a] shadow-sm ring-1 ring-black/[0.06]">
            <ChevronDown className="size-3.5 shrink-0" strokeWidth={2} aria-hidden />
            More below
          </span>
        </div>
      ) : null}
    </div>
  );
}
