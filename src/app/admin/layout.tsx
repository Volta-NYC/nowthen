import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminTopbar from "@/lib/components/admin/admin-topbar"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims

  if (!claims) redirect("/login")

  const userId = claims.sub as string
  const email = (claims.email as string) ?? ""

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single()

  if (profile?.role !== "admin") redirect("/")

  return (
    <div className="min-h-screen bg-bone-50">
      <AdminTopbar email={email} />
      <main>{children}</main>
    </div>
  )
}
