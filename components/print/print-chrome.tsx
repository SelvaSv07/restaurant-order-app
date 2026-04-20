"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

import { Button } from "@/components/ui/button";

function subscribeSilent() {
  return () => {};
}

function getSilentClient() {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("silent") === "1";
}

/**
 * Browser / manual print: auto-opens the system dialog after load.
 * Desktop silent path (`?silent=1`): main process calls webContents.print — do not call window.print here.
 */
export function PrintChrome({ children }: { children: React.ReactNode }) {
  const didAutoPrint = useRef(false);
  const silent = useSyncExternalStore(subscribeSilent, getSilentClient, () => false);

  useEffect(() => {
    if (silent) return;
    const id = window.setTimeout(() => {
      if (didAutoPrint.current) return;
      didAutoPrint.current = true;
      window.print();
    }, 450);
    return () => window.clearTimeout(id);
  }, [silent]);

  if (silent) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {!silent ? (
        <div className="print:hidden fixed inset-x-0 bottom-0 z-50 border-t border-[#ebebeb] bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="mx-auto flex max-w-lg flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              className="rounded-full border-0 bg-[#ff6b1e] px-6 font-semibold text-white hover:bg-[#ea580c]"
              onClick={() => window.print()}
            >
              Print
            </Button>
            <p className="text-center text-xs text-[#858585]">
              Choose your thermal printer in the system dialog. Tap Print if the dialog did not open.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
