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
