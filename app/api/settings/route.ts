import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { businessSettings, categories, printerSettings, products } from "@/lib/db/schema";
import { ensureDefaults } from "@/lib/repository";

const payloadSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("category"),
    name: z.string().min(1),
    iconKey: z.string().optional(),
    colorHex: z.string().optional(),
  }),
  z.object({
    type: z.literal("product"),
    name: z.string().min(1),
    categoryId: z.number().int().positive(),
    priceRupee: z.number().int().nonnegative(),
    includeInKot: z.boolean(),
    active: z.boolean(),
  }),
  z.object({
    type: z.literal("business"),
    shopName: z.string().min(1),
    ownerName: z.string(),
    phone: z.string(),
    address: z.string(),
    gstNumber: z.string(),
  }),
  z.object({
    type: z.literal("printer"),
    headerText: z.string().min(1),
    footerText: z.string().min(1),
    paperWidth: z.enum(["58mm", "80mm"]),
    receiptPrinterName: z.string(),
    kotPrinterName: z.string(),
  }),
]);

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await ensureDefaults();
  const payload = parsed.data;

  if (payload.type === "category") {
    await db.insert(categories).values({
      name: payload.name,
      iconKey: payload.iconKey ?? "Utensils",
      colorHex: payload.colorHex ?? "#f97316",
    });
  }

  if (payload.type === "product") {
    await db.insert(products).values({
      name: payload.name,
      categoryId: payload.categoryId,
      priceRupee: payload.priceRupee,
      includeInKot: payload.includeInKot,
      active: payload.active,
    });
  }

  if (payload.type === "business") {
    await db
      .update(businessSettings)
      .set({
        shopName: payload.shopName,
        ownerName: payload.ownerName,
        phone: payload.phone,
        address: payload.address,
        gstNumber: payload.gstNumber,
      })
      .where(eq(businessSettings.id, 1));
  }

  if (payload.type === "printer") {
    await db
      .update(printerSettings)
      .set({
        headerText: payload.headerText,
        footerText: payload.footerText,
        paperWidth: payload.paperWidth,
        receiptPrinterName: payload.receiptPrinterName,
        kotPrinterName: payload.kotPrinterName,
      })
      .where(eq(printerSettings.id, 1));
  }

  return NextResponse.json({ ok: true });
}

