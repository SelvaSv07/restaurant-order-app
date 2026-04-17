import { toast } from "sonner";

function isElectronApp(): boolean {
  if (typeof window === "undefined") return false;
  return window.navigator.userAgent.includes("Electron");
}

/** Embedded Next server listens on 127.0.0.1; use that host for print URLs in Electron. */
function resolvePrintBaseUrl(): string {
  if (typeof window === "undefined") return "";
  const port = window.location.port;
  if (isElectronApp() && port) {
    return `http://127.0.0.1:${port}`;
  }
  return window.location.origin;
}

/** `noopener` clears `window.opener` in the child — KOT browser flow uses postMessage to opener. */
function openPrintWindow(url: string, opts?: { retainOpener?: boolean }): boolean {
  const retainOpener = opts?.retainOpener === true;
  const opened = retainOpener
    ? window.open(url, "_blank")
    : window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    toast.error("Pop-up blocked", { description: "Allow pop-ups for this app to print." });
    return false;
  }
  return true;
}

/**
 * Send raw ESC/POS bytes to the configured printer via server-side API.
 * This bypasses Chromium's unreliable webContents.print on Windows.
 */
async function printViaRawApi(
  billId: number,
  type: "receipt" | "kot",
): Promise<{ ok: boolean; error?: string }> {
  const endpoint =
    type === "receipt" ? `/api/bills/${billId}/print` : `/api/bills/${billId}/print-kot`;
  try {
    const res = await fetch(endpoint, { method: "POST" });
    const json = (await res.json()) as { ok: boolean; error?: string; message?: string };
    return { ok: json.ok, error: json.error ?? json.message };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

export async function printReceiptToConfiguredDevice(billId: number): Promise<boolean> {
  if (isElectronApp()) {
    const result = await printViaRawApi(billId, "receipt");
    if (result.ok) {
      toast.success("Receipt sent to printer");
      return true;
    }
    toast.error("Receipt print failed", {
      description: result.error ?? "Check Settings → Printer and the printer connection.",
    });
    return false;
  }

  const base = resolvePrintBaseUrl();
  const url = `${base}/print/${billId}`;
  const ok = openPrintWindow(url);
  if (ok) {
    toast.success("Print window opened");
  }
  return ok;
}

export async function printKotToConfiguredDevice(billId: number): Promise<boolean> {
  if (isElectronApp()) {
    const result = await printViaRawApi(billId, "kot");
    if (result.ok) {
      toast.success("KOT sent to printer");
      return true;
    }
    toast.error("KOT print failed", {
      description: result.error ?? "Check Settings → Printer and the KOT device.",
    });
    return false;
  }

  const base = resolvePrintBaseUrl();
  const url = `${base}/print/${billId}/kot`;
  const ok = openPrintWindow(url, { retainOpener: true });
  if (!ok) return false;
  toast.success("KOT print window opened");

  return new Promise((resolve) => {
    let settled = false;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "kot-print-ready" && e.data.billId === billId) {
        finish(true);
      }
    };
    const finish = (success: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      resolve(success);
    };
    window.addEventListener("message", onMessage);
    const timeoutId = window.setTimeout(() => {
      toast.error("KOT window timed out", { description: "Close the print window and try again." });
      finish(false);
    }, 30_000);
  });
}
