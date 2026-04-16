import { AddCategoryDialog } from "@/components/app/add-category-dialog";
import { DeleteCategoryDialog } from "@/components/app/delete-category-dialog";
import { EditCategoryDialog } from "@/components/app/edit-category-dialog";
import { SettingsBackLink } from "@/components/app/settings-back-link";
import { CategoryLucideIcon } from "@/components/category-lucide-icon";
import { getSettingsData } from "@/lib/repository";

export default async function SettingsCategoriesPage() {
  const data = await getSettingsData();

  const productCountByCategory = new Map<number, number>();
  for (const p of data.prods) {
    productCountByCategory.set(p.categoryId, (productCountByCategory.get(p.categoryId) ?? 0) + 1);
  }

  const takenColorHexes = data.cats.map((c) => c.colorHex);

  return (
    <div className="space-y-6">
      <SettingsBackLink />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#333]">Categories</h1>
          <p className="text-sm text-[#858585]">Create and manage product categories.</p>
        </div>
        <AddCategoryDialog takenColorHexes={takenColorHexes} />
      </div>
      <div className="space-y-2">
        {data.cats.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#ebebeb] bg-white p-8 text-center text-sm text-[#858585]">
            No categories yet. Click &quot;Add category&quot; to create one.
          </p>
        ) : (
          data.cats.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#ebebeb] bg-white p-3 text-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex size-9 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${category.colorHex}22` }}
                >
                  <CategoryLucideIcon name={category.iconKey} color={category.colorHex} className="size-5" />
                </span>
                <div>
                  <p className="font-medium text-[#333]">{category.name}</p>
                  <p className="text-xs text-[#858585]">
                    {category.iconKey} · {category.colorHex}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <EditCategoryDialog
                  category={category}
                  otherCategoriesColorHexes={data.cats.filter((c) => c.id !== category.id).map((c) => c.colorHex)}
                />
                <DeleteCategoryDialog
                  categoryId={category.id}
                  categoryName={category.name}
                  productCount={productCountByCategory.get(category.id) ?? 0}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
