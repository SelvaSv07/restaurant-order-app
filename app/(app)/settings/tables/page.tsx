import { LayoutGrid } from "lucide-react";

import { addTableAction } from "@/app/(app)/settings/actions";
import { SettingsBackLink } from "@/components/app/settings-back-link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getTables } from "@/lib/repository";

export default async function SettingsTablesPage() {
  const tables = await getTables();

  return (
    <div className="space-y-6">
      <SettingsBackLink />
      <div>
        <h1 className="text-2xl font-semibold text-[#333]">Tables</h1>
        <p className="text-sm text-[#858585]">
          Add dining tables here. They appear on the Dine-in screen for billing by table.
        </p>
      </div>

      <div className="rounded-xl border border-[#ebebeb] bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-[#333]">Add table</p>
        <form action={addTableAction} className="mt-3 flex flex-wrap items-end gap-2">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="table-name" className="sr-only">
              Table name
            </label>
            <Input
              id="table-name"
              name="name"
              placeholder="e.g. Table 1, Window 2"
              required
              className="border-[#ebebeb]"
            />
          </div>
          <Button type="submit" className="bg-[#ff6b1e] hover:bg-[#ea580c]">
            Add table
          </Button>
        </form>
      </div>

      <div className="space-y-2">
        {tables.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#ebebeb] bg-white p-8 text-center text-sm text-[#858585]">
            No tables yet. Add a name above to create your first table.
          </p>
        ) : (
          tables.map((table) => (
            <div
              key={table.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ebebeb] bg-white p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#f9f4ef] text-[#ff6b1e]">
                  <LayoutGrid className="size-5" strokeWidth={2} />
                </span>
                <div>
                  <p className="font-medium text-[#333]">{table.name}</p>
                  <p className="text-xs text-[#858585]">ID {table.id}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
