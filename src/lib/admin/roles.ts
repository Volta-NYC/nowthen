export const ROLES = ["customer", "admin", "owner"] as const

export type Role = (typeof ROLES)[number]

/**
 * Owners inherit every admin power, so anything gating the admin area must ask
 * this rather than testing `role === "admin"` — that literal comparison would
 * lock owners out of the very area they administer.
 */
export function isStaffRole(role: string | null | undefined): boolean {
  return role === "admin" || role === "owner"
}

/** Only owners may change anyone's role. Enforced for real by RLS + the
 * `guard_profile_changes` trigger; this is the app-side mirror of that rule. */
export function isOwnerRole(role: string | null | undefined): boolean {
  return role === "owner"
}
