"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type InventoryStatus = "posted" | "draft" | "sold out" | "archived"

export const STATUS_OPTIONS: InventoryStatus[] = ["draft", "posted", "sold out", "archived"]

export type InventoryItem = {
  id: string
  item_number: string | null
  sku: string | null
  item_name: string
  vintage_or_upcycled: string | null
  category: string | null
  article: string | null
  brand: string | null
  season: string[] | null
  listed_size: string | null
  dimensions: string | null
  weight: string | null
  purchase_date: string | null
  purchase_location: string | null
  purchase_price: number | null
  list_price: number | null
  sale_price: number | null
  decade: string[] | null
  condition: string | null
  description: string | null
  main_color: string[] | null
  material: string[] | null
  photos: string[] | null
  stock_level: number | null
  location: string | null
  mood: string[] | null
  status: InventoryStatus
  created_at: string
}

export type InventoryListItem = Pick<
  InventoryItem,
  "id" | "item_name" | "list_price" | "stock_level" | "status" | "photos"
>

export type InventoryItemFields = Partial<Omit<InventoryItem, "id" | "created_at">>

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
    await supabase.storage.from("inventory-photos").remove(photos)
  }

  const { error } = await supabase.from("inventory_items").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/inventory")
  return { data: { id } }
}
