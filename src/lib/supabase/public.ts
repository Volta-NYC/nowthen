import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Anonymous, cookie-free client for public catalog reads.
//
// The storefront deliberately does NOT use the session-bound server client:
// an admin's session would satisfy the admin RLS policy and surface draft
// items on the public site. Reading as `anon` means every visitor — including
// the owner — sees exactly the same catalog, and keeps storefront pages
// cacheable, since nothing here touches `cookies()`.
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
