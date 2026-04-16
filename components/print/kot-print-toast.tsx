"use client";

import { useEffect } from "react";
import { toast } from "sonner";

/** Shows a toast after the browser print flow finishes (dialog closed). */
export function KotPrintToast() {
  useEffect(() => {
    const onAfterPrint = () => {
      toast.success("KOT printed");
    };
    window.addEventListener("afterprint", onAfterPrint);
    return () => window.removeEventListener("afterprint", onAfterPrint);
  }, []);
  return null;
}
