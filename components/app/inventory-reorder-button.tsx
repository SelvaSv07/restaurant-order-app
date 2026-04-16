"use client";

import { toast } from "sonner";

export function InventoryReorderButton({ itemName }: { itemName: string }) {
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-[#ebebeb] bg-white px-2.5 py-1.5 text-[10px] font-medium text-[#333] transition hover:bg-[#f7f7f7]"
      onClick={() => toast.message(`Reorder noted for ${itemName}`)}
    >
      Reorder
    </button>
  );
}
