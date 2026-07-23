"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { InventoryItem, InventoryItemFields, InventoryStatus } from "./inventory-types"

export type { InventoryStatus, InventoryItem, InventoryListItem, InventoryItemFields } from "./inventory-types"

type ActionResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string }

export async function createDraftItem(): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("inventory_items")
    .insert({ item_name: "Untitled item", status: "draft" })
    .select("id")
    .single()

  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  return { data: { id: data.id as string } }
}

export async function updateItem(
  id: string,
  fields: InventoryItemFields,
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()
  const { error } = await supabase.from("inventory_items").update(fields).eq("id", id)

  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  revalidatePath(`/admin/inventory/${id}`)
  return { data: { id } }
}

export async function bulkUpdateStatus(
  ids: string[],
  status: InventoryStatus,
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient()
  const { error } = await supabase.from("inventory_items").update({ status }).in("id", ids)

  if (error) return { error: error.message }
  revalidatePath("/admin/inventory")
  return { data: { count: ids.length } }
}

export async function deleteItem(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  const { data: item, error: fetchError } = await supabase
    .from("inventory_items")
    .select("photos")
    .eq("id", id)
    .single()

  if (fetchError) return { error: fetchError.message }

  const photos = (item?.photos ?? []) as string[]
  if (photos.length > 0) {
    const { error: removeError } = await supabase.storage.from("inventory-photos").remove(photos)
    if (removeError) return { error: removeError.message }
  }

  const { error } = await supabase.from("inventory_items").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/inventory")
  return { data: { id } }
}
