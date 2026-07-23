import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import InventoryForm from "@/lib/components/admin/inventory-form"
import type { InventoryItem } from "@/lib/admin/inventory-actions"

export default async function EditInventoryItemPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: item, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("id", id)
    .single()

  if (error || !item) notFound()

  return <InventoryForm item={item as InventoryItem} />
}
