"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ElectronPrinterInfo } from "@/types/electron-print";

const businessSchema = z.object({
  shopName: z.string().min(1),
  ownerName: z.string(),
  phone: z.string(),
  address: z.string(),
  gstNumber: z.string(),
});
const printerSchema = z.object({
  headerText: z.string().min(1),
  footerText: z.string().min(1),
  paperWidth: z.enum(["58mm", "80mm"]),
  receiptPrinterName: z.string(),
  kotPrinterName: z.string(),
});

const DEFAULT_PRINTER_VALUE = "__default__";

function toSelectValue(stored: string) {
  return stored.trim() === "" ? DEFAULT_PRINTER_VALUE : stored;
}

function fromSelectValue(v: string) {
  return v === DEFAULT_PRINTER_VALUE ? "" : v;
}

async function post(body: unknown) {
  const response = await fetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error("Request failed");
}

export function BusinessForm({
  defaults,
}: {
  defaults: { shopName: string; ownerName: string; phone: string; address: string; gstNumber: string };
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: defaults,
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setSaving(true);
        await post({ type: "business", ...values });
        setSaving(false);
      })}
      className="grid gap-2 md:grid-cols-2"
    >
      <Input className="cursor-text" placeholder="Shop name" {...form.register("shopName")} />
      <Input className="cursor-text" placeholder="Owner name" {...form.register("ownerName")} />
      <Input className="cursor-text" placeholder="Phone" {...form.register("phone")} />
      <Input className="cursor-text" placeholder="GST number" {...form.register("gstNumber")} />
      <Input className="cursor-text md:col-span-2" placeholder="Address" {...form.register("address")} />
      <Button
        type="submit"
        disabled={saving}
        className="border-0 bg-[#ff6b1e] font-semibold shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 md:w-fit"
      >
        Save business details
      </Button>
    </form>
  );
}

function PrinterDeviceSelect({
  id,
  label,
  printers,
  value,
  onChange,
}: {
  id: string;
  label: string;
  printers: ElectronPrinterInfo[];
  value: string;
  onChange: (next: string) => void;
}) {
  const selectVal = toSelectValue(value);
  const knownNames = new Set(printers.map((p) => p.name));
  const orphanSaved = value.trim() !== "" && !knownNames.has(value);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[#454545]">
        {label}
      </Label>
      <Select
        value={selectVal}
        onValueChange={(v) => {
          if (v) onChange(fromSelectValue(v));
        }}
      >
        <SelectTrigger
          id={id}
          className={cn(
            "h-10 w-full cursor-pointer rounded-lg border-0 bg-[#f7f7f7] shadow-none ring-1 ring-[#ebebeb]",
            "justify-between px-3 text-left text-sm text-[#333] hover:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35",
          )}
          size="default"
        >
          <SelectValue placeholder="Choose printer" />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectItem value={DEFAULT_PRINTER_VALUE}>Default (Windows default)</SelectItem>
          {orphanSaved ? (
            <SelectItem value={value}>{value} (saved)</SelectItem>
          ) : null}
          {printers.map((p) => (
            <SelectItem key={p.name} value={p.name}>
              {p.displayName?.trim() || p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function PrinterForm({
  defaults,
}: {
  defaults: {
    headerText: string;
    footerText: string;
    paperWidth: "58mm" | "80mm";
    receiptPrinterName: string;
    kotPrinterName: string;
  };
}) {
  const [saving, setSaving] = useState(false);
  const [printers, setPrinters] = useState<ElectronPrinterInfo[]>([]);
  const [printerListError, setPrinterListError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshPrinters = useCallback(async () => {
    const ep = typeof window !== "undefined" ? window.electronPrint : undefined;
    if (!ep) {
      setPrinters([]);
      setPrinterListError(null);
      return;
    }
    setRefreshing(true);
    setPrinterListError(null);
    try {
      const list = await ep.listPrinters();
      setPrinters(Array.isArray(list) ? list : []);
    } catch {
      setPrinterListError("Could not load printers");
      setPrinters([]);
    } finally {
      setRefreshing(false);
    }
  }, []);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    void refreshPrinters();
  }, [refreshPrinters]);

  const form = useForm<z.infer<typeof printerSchema>>({
    resolver: zodResolver(printerSchema),
    defaultValues: defaults,
  });

  const isElectron = mounted && !!window.electronPrint;
  const showBrowserNotice = mounted && !isElectron;

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setSaving(true);
        await post({ type: "printer", ...values });
        setSaving(false);
      })}
      className="space-y-6"
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-[#333]">Receipt &amp; KOT devices</p>
            <p className="text-xs text-[#858585]">
              In the desktop app, silent print uses these Windows printers. Leave as default to use the system default.
            </p>
          </div>
          {isElectron ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-lg"
              disabled={refreshing}
              onClick={() => void refreshPrinters()}
            >
              <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")} />
              Refresh list
            </Button>
          ) : null}
        </div>
        {printerListError ? <p className="text-xs text-red-600">{printerListError}</p> : null}
        {showBrowserNotice ? (
          <p className="rounded-lg bg-[#f7f7f7] px-3 py-2 text-xs text-[#858585]">
            Printer names are applied when you run the Restaurant Order desktop app (Electron). In the browser, printing
            still uses the normal print dialog.
          </p>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={form.control}
            name="receiptPrinterName"
            render={({ field }) => (
              <PrinterDeviceSelect
                id="receipt-printer"
                label="Receipt (bill) printer"
                printers={printers}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          <Controller
            control={form.control}
            name="kotPrinterName"
            render={({ field }) => (
              <PrinterDeviceSelect
                id="kot-printer"
                label="Kitchen (KOT) printer"
                printers={printers}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-[#333]">Receipt layout</p>
        <div className="grid gap-2 md:grid-cols-2">
          <Input className="cursor-text" placeholder="Header text" {...form.register("headerText")} />
          <Input className="cursor-text" placeholder="Footer text" {...form.register("footerText")} />
          <div className="md:col-span-2">
            <Controller
              control={form.control}
              name="paperWidth"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    if (v) field.onChange(v);
                  }}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 w-full cursor-pointer rounded-lg border-0 bg-[#f7f7f7] shadow-none ring-1 ring-[#ebebeb]",
                      "justify-between px-3 text-left text-sm text-[#333] hover:bg-[#f0f0f0] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35",
                    )}
                    size="default"
                  >
                    <SelectValue placeholder="Paper width" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectItem value="80mm">80mm</SelectItem>
                    <SelectItem value="58mm">58mm</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="border-0 bg-[#ff6b1e] font-semibold shadow-none hover:bg-[#ea580c] focus-visible:ring-2 focus-visible:ring-[#ff6b1e]/35 md:w-fit"
      >
        Save printer settings
      </Button>
    </form>
  );
}
