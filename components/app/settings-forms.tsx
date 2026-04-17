"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
});

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

export function PrinterForm({
  defaults,
}: {
  defaults: { headerText: string; footerText: string; paperWidth: "58mm" | "80mm" };
}) {
  const [saving, setSaving] = useState(false);
  const form = useForm<z.infer<typeof printerSchema>>({
    resolver: zodResolver(printerSchema),
    defaultValues: defaults,
  });

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setSaving(true);
        await post({ type: "printer", ...values });
        setSaving(false);
      })}
      className="grid gap-2 md:grid-cols-2"
    >
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
