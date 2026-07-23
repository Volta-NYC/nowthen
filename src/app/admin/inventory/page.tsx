import { createClient } from "@/lib/supabase/server"
import InventoryTable from "@/lib/components/admin/inventory-table"
import NewItemButton from "@/lib/components/admin/new-item-button"
import type { InventoryListItem } from "@/lib/admin/inventory-actions"

export const metadata = { title: "Inventory" }

export default async function AdminInventoryPage() {
  const supabase = await createClient()
  const { data: items, error } = await supabase
    .from("inventory_items")
    .select("id, item_name, list_price, stock_level, status, photos")
    .order("created_at", { ascending: false })

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Inventory</h1>
        <NewItemButton />
      </div>

      {error && <p className="mt-6 text-sm text-clay">{error.message}</p>}
      {!error && <InventoryTable items={(items ?? []) as InventoryListItem[]} />}
    </div>
  )
}
