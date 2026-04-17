"use client";

import { useEffect } from "react";

/** Notifies the opener when this KOT print page is ready so the parent can mark lines sent after render. */
export function KotPrintReadyBridge({ billId }: { billId: number }) {
  useEffect(() => {
    window.opener?.postMessage({ type: "kot-print-ready", billId }, "*");
  }, [billId]);
  return null;
}
