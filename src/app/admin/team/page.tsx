import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import TeamTable from "@/lib/components/admin/team-table"
import { isOwnerRole } from "@/lib/admin/roles"
import type { TeamMember } from "@/lib/admin/team-actions"

export const metadata = { title: "Team" }

export default async function AdminTeamPage() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims?.sub as string

  // The layout has already proven this user is staff; this narrows it further
  // to owners, since admins can reach the URL directly by typing it.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()

  if (!isOwnerRole(profile?.role)) redirect("/admin/inventory")

  const { data: members, error } = await supabase
    .from("profiles")
    .select("id, email, role, created_at")
    .order("email")

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="font-display text-3xl">Team</h1>
      <p className="mt-2 max-w-xl text-sm text-ink-muted">
        Admins can manage inventory. Owners can do that and manage this list.
      </p>

      {error && <p className="mt-6 text-sm text-clay">{error.message}</p>}
      {!error && (
        <TeamTable members={(members ?? []) as TeamMember[]} currentUserId={userId} />
      )}
    </div>
  )
}
