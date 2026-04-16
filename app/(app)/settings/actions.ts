"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { count, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { categories, diningTables, products } from "@/lib/db/schema";
import { isPaletteColor, normalizeColorHex } from "@/lib/category-colors";
import { CATEGORY_ICON_KEYS, type CategoryIconKey } from "@/lib/category-icons";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/product-image";

const SETTINGS_PATHS = [
  "/settings",
  "/settings/categories",
  "/settings/products",
  "/settings/business",
  "/settings/other",
  "/settings/tables",
] as const;

function revalidateSettings() {
  for (const p of SETTINGS_PATHS) revalidatePath(p);
}

export async function addTableAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  await db.insert(diningTables).values({ name });
  revalidateSettings();
  revalidatePath("/dine-in");
}

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "products");

const ALLOWED_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif"]);

function safeIconKey(value: string): CategoryIconKey {
  return (CATEGORY_ICON_KEYS.includes(value as CategoryIconKey) ? value : "Utensils") as CategoryIconKey;
}

async function isCategoryColorTakenByOther(
  colorHex: string,
  excludeCategoryId?: number,
): Promise<boolean> {
  const n = normalizeColorHex(colorHex);
  if (!n || !isPaletteColor(colorHex)) return true;
  const rows = await db.select({ id: categories.id, colorHex: categories.colorHex }).from(categories);
  return rows.some(
    (row) =>
      normalizeColorHex(row.colorHex) === n &&
      (excludeCategoryId === undefined || row.id !== excludeCategoryId),
  );
}

async function saveProductImage(file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) throw new Error("Image must be 2MB or smaller");
  const type = file.type;
  if (!type.startsWith("image/")) throw new Error("Only image files are allowed");

  const orig = path.extname(file.name).toLowerCase();
  const ext = orig && ALLOWED_EXT.has(orig) ? orig : ".jpg";
  if (!ALLOWED_EXT.has(ext)) throw new Error("Use JPG, PNG, WebP, or GIF");

  await mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${nanoid()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, filename), buffer);
  return `/uploads/products/${filename}`;
}

export async function createCategoryAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };
  const iconKey = safeIconKey(String(formData.get("iconKey") ?? "Utensils"));
  const rawColor = String(formData.get("colorHex") ?? "").trim();
  if (!isPaletteColor(rawColor)) {
    return { ok: false, error: "Pick a color from the palette." };
  }
  const colorHex = normalizeColorHex(rawColor);
  if (await isCategoryColorTakenByOther(colorHex)) {
    return { ok: false, error: "That color is already used by another category." };
  }

  await db.insert(categories).values({ name, iconKey, colorHex });
  revalidateSettings();
  revalidatePath("/billing");
  return { ok: true };
}

export async function updateCategoryAction(
  formData: FormData,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const id = Number(formData.get("categoryId"));
  const name = String(formData.get("name") ?? "").trim();
  if (!Number.isFinite(id) || id <= 0 || !name) {
    return { ok: false, error: "Invalid category." };
  }
  const iconKey = safeIconKey(String(formData.get("iconKey") ?? "Utensils"));
  const rawColor = String(formData.get("colorHex") ?? "").trim();
  if (!isPaletteColor(rawColor)) {
    return { ok: false, error: "Pick a color from the palette." };
  }
  const colorHex = normalizeColorHex(rawColor);
  if (await isCategoryColorTakenByOther(colorHex, id)) {
    return { ok: false, error: "That color is already used by another category." };
  }

  await db.update(categories).set({ name, iconKey, colorHex }).where(eq(categories.id, id));
  revalidateSettings();
  revalidatePath("/billing");
  return { ok: true };
}

export async function createProductAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const priceRupee = Number(formData.get("priceRupee"));
  const includeInKot = formData.get("includeInKot") === "on";
  const active = formData.get("active") !== "false";

  if (!name || !Number.isFinite(categoryId) || categoryId <= 0 || !Number.isFinite(priceRupee) || priceRupee < 0) {
    return;
  }

  const file = formData.get("image");
  let imageLocalPath: string | null = null;
  if (file instanceof File && file.size > 0) {
    imageLocalPath = await saveProductImage(file);
  }

  await db.insert(products).values({
    name,
    categoryId,
    priceRupee: Math.round(priceRupee),
    includeInKot,
    active,
    imageLocalPath,
  });

  revalidateSettings();
  revalidatePath("/billing");
}

export async function deleteCategoryAction(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const id = Number(formData.get("id"));
  if (!id) return { ok: false, error: "Invalid category" };

  const [row] = await db
    .select({ n: count() })
    .from(products)
    .where(eq(products.categoryId, id));
  const n = Number(row?.n ?? 0);
  if (n > 0) {
    return {
      ok: false,
      error: "This category has products. Move or delete those products first.",
    };
  }

  await db.delete(categories).where(eq(categories.id, id));
  revalidateSettings();
  revalidatePath("/billing");
  return { ok: true };
}

export async function deleteProductAction(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await db.delete(products).where(eq(products.id, id));
  revalidateSettings();
  revalidatePath("/billing");
}

export async function updateProductAction(formData: FormData) {
  const productId = Number(formData.get("productId"));
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = Number(formData.get("categoryId"));
  const priceRupee = Number(formData.get("priceRupee"));
  const includeInKot = formData.get("includeInKot") === "on";
  const active = formData.get("active") === "on";

  if (
    !Number.isFinite(productId) ||
    productId <= 0 ||
    !name ||
    !Number.isFinite(categoryId) ||
    categoryId <= 0 ||
    !Number.isFinite(priceRupee) ||
    priceRupee < 0
  ) {
    return;
  }

  const file = formData.get("image");
  const patch: {
    name: string;
    categoryId: number;
    priceRupee: number;
    includeInKot: boolean;
    active: boolean;
    imageLocalPath?: string | null;
  } = {
    name,
    categoryId,
    priceRupee: Math.round(priceRupee),
    includeInKot,
    active,
  };

  if (file instanceof File && file.size > 0) {
    patch.imageLocalPath = await saveProductImage(file);
  }

  await db.update(products).set(patch).where(eq(products.id, productId));

  revalidateSettings();
  revalidatePath("/billing");
}
