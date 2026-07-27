// The storefront's view of a catalog item. Rows in `public.inventory_items`
// are adapted into this shape by `products-db.ts`; nothing outside that module
// should know the database column names.
//
// Deliberately free of imports so client components can take a `Product` prop
// without dragging server-only Supabase code into the browser bundle.

export type Product = {
  /** `inventory_items.id` — what cart rows reference. */
  id: string;
  slug: string;
  name: string;
  designer?: string;
  price: number;
  fromPrice?: boolean;
  collections: string[]; // collection slugs
  era?: "now" | "then";
  palette: string[]; // hex chips
  images: string[]; // fully-resolved public URLs
  blurb: string;
  story?: string;
  details?: string[];
  sizes?: string[];
  variant?: { label: string; value: string }[];
  featured?: boolean;
};
