import { toast } from "sonner";

function getElectronPrint(): Window["electronPrint"] {
  if (typeof window === "undefined") return undefined;
  return window.electronPrint;
}

/** The embedded Next server listens on 127.0.0.1; use that host so print IPC accepts the URL (avoids [::1] quirks). */
function resolvePrintBaseUrl(): string {
  if (typeof window === "undefined") return "";
  if (!window.electronPrint) return window.location.origin;
  const port = window.location.port;
  if (port) return `http://127.0.0.1:${port}`;
  return "http://127.0.0.1";
}

async function fetchPrinterDeviceNames(): Promise<{ receiptPrinterName: string; kotPrinterName: string }> {
  const res = await fetch("/api/settings/printer");
  if (!res.ok) throw new Error("Failed to load printer settings");
  return res.json();
}

export async function printReceiptToConfiguredDevice(billId: number): Promise<boolean> {
  const url = `${resolvePrintBaseUrl()}/print/${billId}`;
  const ep = getElectronPrint();
  const { receiptPrinterName } = await fetchPrinterDeviceNames();
  const deviceName = receiptPrinterName.trim() || undefined;

  if (ep) {
    const result = await ep.printUrl(url, { deviceName });
    if (!result.ok) {
      toast.error("Receipt print failed", { description: result.error ?? "Unknown error" });
      return false;
    }
    return true;
  }

  window.open(url, "_blank", "noopener,noreferrer");
  return true;
}

export async function printKotToConfiguredDevice(billId: number): Promise<boolean> {
  const url = `${resolvePrintBaseUrl()}/print/${billId}/kot`;
  const ep = getElectronPrint();
  const { kotPrinterName } = await fetchPrinterDeviceNames();
  const deviceName = kotPrinterName.trim() || undefined;

  if (ep) {
    const result = await ep.printUrl(url, { deviceName });
    if (!result.ok) {
      toast.error("KOT print failed", { description: result.error ?? "Unknown error" });
      return false;
    }
    return true;
  }

  return new Promise((resolve) => {
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) {
      toast.error("Pop-up blocked", { description: "Allow pop-ups to print KOT." });
      resolve(false);
      return;
    }
    let settled = false;
    let timeoutId: ReturnType<typeof window.setTimeout>;
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "kot-print-ready" && e.data.billId === billId) {
        finish(true);
      }
    };
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.removeEventListener("message", onMessage);
      resolve(ok);
    };
    window.addEventListener("message", onMessage);
    timeoutId = window.setTimeout(() => {
      toast.error("KOT print timed out", { description: "Reload and try again." });
      finish(false);
    }, 12_000);
  });
}
