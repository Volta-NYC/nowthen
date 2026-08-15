"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { isOwnerRole, type Role } from "./roles"

export type TeamMember = {
  id: string
  email: string
  role: Role
  created_at: string
}

// Tagged with `ok` rather than testing `error` for truthiness: `error` is a
// plain string, so a falsy check can't narrow the union and every `data` access
// stays possibly-undefined.
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

type OwnerSession = Awaited<ReturnType<typeof createClient>>

/**
 * Re-derives the caller's role from the database on every action. Hiding the
 * Team tab in the topbar is an affordance, not a permission check — a server
 * action is a public endpoint, so it has to prove ownership itself. RLS and the
 * `guard_profile_changes` trigger are the third layer behind this.
 */
async function requireOwner(): Promise<ActionResult<{ supabase: OwnerSession; userId: string }>> {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub as string | undefined

  if (!userId) return { ok: false, error: "You are not signed in." }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (error) return { ok: false, error: error.message }
  if (!isOwnerRole(profile?.role)) {
    return { ok: false, error: "Only an owner can manage the team." }
  }

  return { ok: true, data: { supabase, userId } }
}

export async function promoteToAdmin(rawEmail: string): Promise<ActionResult<TeamMember>> {
  const session = await requireOwner()
  if (!session.ok) return session

  // auth.users stores emails lowercased and `handle_new_user` copies them
  // verbatim, so matching on the normalised form is an exact match. Using
  // `eq` rather than `ilike` also keeps `%` and `_` in the input from being
  // read as wildcards and matching an account nobody typed.
  const email = rawEmail.trim().toLowerCase()
  if (!email) return { ok: false, error: "Enter an email address." }

  const { supabase } = session.data
  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .eq("email", email)
    .maybeSingle()

  if (lookupError) return { ok: false, error: lookupError.message }
  if (!existing) {
    return {
      ok: false,
      error: `No account found for ${email}. They need to sign up first, then you can add them here.`,
    }
  }
  if (existing.role === "owner") {
    return { ok: false, error: `${email} is an owner, which already includes admin access.` }
  }
  if (existing.role === "admin") {
    return { ok: false, error: `${email} is already an admin.` }
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", existing.id)
    .select("id, email, role, created_at")
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/team")
  return { ok: true, data: updated as TeamMember }
}

export async function demoteToCustomer(userId: string): Promise<ActionResult<TeamMember>> {
  const session = await requireOwner()
  if (!session.ok) return session

  const { supabase } = session.data
  const { data: target, error: lookupError } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .eq("id", userId)
    .maybeSingle()

  if (lookupError) return { ok: false, error: lookupError.message }
  if (!target) return { ok: false, error: "That account no longer exists." }
  if (target.role === "owner") {
    return {
      ok: false,
      error: "Owners cannot be removed here. Change their role in the database first.",
    }
  }
  if (target.role !== "admin") return { ok: false, error: `${target.email} is not an admin.` }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ role: "customer" })
    .eq("id", userId)
    .select("id, email, role, created_at")
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath("/admin/team")
  return { ok: true, data: updated as TeamMember }
}
