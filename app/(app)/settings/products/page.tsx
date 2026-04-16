import Image from "next/image";
import Link from "next/link";

import { AddProductDialog } from "@/components/app/add-product-dialog";
import { DeleteProductDialog } from "@/components/app/delete-product-dialog";
import { EditProductDialog } from "@/components/app/edit-product-dialog";
import { SettingsBackLink } from "@/components/app/settings-back-link";
import { formatINR } from "@/lib/money";
import { getSettingsData } from "@/lib/repository";

export default async function SettingsProductsPage() {
  const data = await getSettingsData();

  return (
    <div className="space-y-6">
      <SettingsBackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Products</h1>
          <p className="text-sm text-[#858585]">Manage menu items and photos.</p>
        </div>
        <AddProductDialog categories={data.cats} />
      </div>
      {data.cats.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#ebebeb] bg-white p-6 text-sm text-[#858585]">
          Add a category under{" "}
          <Link href="/settings/categories" className="cursor-pointer font-medium text-[#ff6b1e] underline underline-offset-2">
            Categories
          </Link>{" "}
          before you can add products.
        </p>
      ) : null}
      <div className="space-y-3">
        {data.prods.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#ebebeb] bg-white p-8 text-center text-sm text-[#858585]">
            No products yet. Click &quot;Add product&quot; to create one.
          </p>
        ) : (
          data.prods.map((product) => (
            <div
              key={product.id}
              className="flex flex-col gap-3 rounded-lg border border-[#ebebeb] bg-white p-3 text-sm md:flex-row md:items-center md:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-[#f9f4ef]">
                  {product.imageLocalPath ? (
                    <Image
                      src={product.imageLocalPath}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="48px"
                      unoptimized
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-[10px] text-[#858585]">
                      No photo
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-[#333]">
                    {product.name} ({formatINR(product.priceRupee)}) {product.includeInKot ? " · KOT" : ""}
                  </p>
                  <p className="text-xs text-[#858585]">
                    {data.cats.find((c) => c.id === product.categoryId)?.name ?? "—"}
                    {!product.active ? " · Inactive" : ""}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:justify-end">
                <EditProductDialog
                  product={{
                    id: product.id,
                    name: product.name,
                    categoryId: product.categoryId,
                    priceRupee: product.priceRupee,
                    includeInKot: product.includeInKot,
                    active: product.active,
                    imageLocalPath: product.imageLocalPath,
                  }}
                  categories={data.cats}
                />
                <DeleteProductDialog productId={product.id} productName={product.name} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
