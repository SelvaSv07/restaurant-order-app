import Link from "next/link";

import { AddInventoryProductDialog } from "@/components/app/add-inventory-product-dialog";
import { DeleteInventoryItemDialog } from "@/components/app/delete-inventory-item-dialog";
import { EditInventoryItemDialog } from "@/components/app/edit-inventory-item-dialog";
import { SettingsBackLink } from "@/components/app/settings-back-link";
import { getInventory } from "@/lib/repository";

export default async function SettingsInventoryPage() {
  const items = await getInventory();

  return (
    <div className="space-y-6">
      <SettingsBackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Inventory items</h1>
          <p className="text-sm text-[#858585]">
            Add ingredients and stock items. View levels and update quantities on the{" "}
            <Link href="/inventory" className="font-medium text-[#ff6b1e] underline underline-offset-2">
              Inventory
            </Link>{" "}
            page.
          </p>
        </div>
        <AddInventoryProductDialog />
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#ebebeb] bg-white p-8 text-center text-sm text-[#858585]">
          No inventory items yet. Click &quot;Add Product&quot; to create one.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-lg border border-[#ebebeb] bg-white p-4 text-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[#333]">{item.name}</p>
                <p className="mt-1 text-[13px] text-[#858585]">
                  {item.quantity} {item.unit}
                  {item.maxStock != null && item.maxStock > 0 ? ` · max ${item.maxStock} ${item.unit}` : null}
                  {item.reorderQty > 0 ? ` · low at ${item.reorderQty} ${item.unit}` : null}
                  <span className="text-[#ebebeb]"> · </span>
                  <span className="text-[#858585]">{item.category}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <EditInventoryItemDialog item={item} />
                <DeleteInventoryItemDialog id={item.id} name={item.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
