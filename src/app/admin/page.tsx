import { redirect } from "next/navigation"

// `/admin` is the URL an admin actually types; inventory is the only section
// so far, so send them there rather than dead-ending on a 404. The role check
// has already run in this segment's layout by the time this renders.
export default function AdminIndexPage() {
  redirect("/admin/inventory")
}
