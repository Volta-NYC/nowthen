"use client"

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import type { Session } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import { isOwnerRole, isStaffRole } from "@/lib/admin/roles"

type AuthContextValue = {
  session: Session | null
  loading: boolean
  /**
   * The signed-in user's `profiles.role`, or null when signed out or still
   * loading. Drives UI affordances only — never treat this as authorization.
   * `src/app/admin/layout.tsx` re-checks the role server-side, and RLS gates
   * the data itself, so a tampered value here reveals nothing.
   */
  role: string | null
  /** True for admins *and* owners — owners inherit every admin power. */
  isAdmin: boolean
  isOwner: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Look the role up per signed-in user. RLS on `profiles` only exposes the
  // caller's own row, so this can't be used to enumerate anyone else's.
  const userId = session?.user.id ?? null
  useEffect(() => {
    if (!userId) {
      setRole(null)
      return
    }

    let cancelled = false
    const supabase = createClient()

    supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          // A failed lookup means no admin affordances, never elevated ones.
          console.error(`[auth] role lookup failed: ${error.message}`)
          setRole(null)
          return
        }
        setRole((data?.role as string | undefined) ?? null)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setSession(null)
    setRole(null)
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        role,
        isAdmin: isStaffRole(role),
        isOwner: isOwnerRole(role),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
