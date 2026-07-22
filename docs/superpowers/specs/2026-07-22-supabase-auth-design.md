# Supabase Auth — Design Spec

Date: 2026-07-22

## Purpose

Connect the storefront to the existing Supabase project (`eywvykiahczpaxplvuum`) with email/password authentication, supporting two kinds of users:

- **Customers** — public signup/login. No dedicated account page yet; the navbar reflects logged-in state.
- **Admins** — same login mechanism, distinguished by a `role` column. No admin UI is built in this task; this just lays the foundation (role storage + RLS) for a future admin area.

Out of scope for this task: Google/OAuth sign-in, a dedicated `/account` page, order history, and any admin dashboard pages. These can build on top of what's shipped here.

## Approach

Use `@supabase/ssr`, the current official pattern for Next.js App Router. It stores the session as httpOnly cookies via a small middleware, so both server components and client components observe the same auth state. This is preferred over a client-only `supabase-js` setup (session in localStorage only) because a server-invisible session would block any future server-side admin route protection.

## Environment & Config

- `.env.local` (already gitignored via `.env*` in `.gitignore`):
  - `NEXT_PUBLIC_SUPABASE_URL=https://eywvykiahczpaxplvuum.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>`
- New dependencies: `@supabase/supabase-js`, `@supabase/ssr`

## Architecture

- `src/lib/supabase/client.ts` — `createBrowserClient` for use in client components.
- `src/lib/supabase/server.ts` — `createServerClient` for use in server components / route handlers, reading/writing the session cookie via Next's `cookies()`.
- `middleware.ts` (project root) — refreshes the session cookie on every request per the `@supabase/ssr` Next.js recipe. Scoped to exclude static assets.

## Data Model

New table `public.profiles`:

| column | type | notes |
|---|---|---|
| `id` | `uuid` | PK, references `auth.users(id)` on delete cascade |
| `email` | `text` | copied from `auth.users` at signup, for convenience |
| `role` | `text` | default `'customer'`, check constraint `role in ('customer', 'admin')` |
| `created_at` | `timestamptz` | default `now()` |

**Trigger:** `on_auth_user_created` on `auth.users` (`after insert`) calls a `SECURITY DEFINER` function `public.handle_new_user()` (schema-qualified, `search_path = ''`) that inserts a row into `public.profiles` with `role = 'customer'`. This is the standard Supabase pattern for auto-provisioning a profile row, since the inserting session isn't authenticated as the new user yet when the trigger fires.

**RLS** (enabled on `profiles`):
- `select`: `to authenticated using (auth.uid() = id)` — a user can read only their own profile.
- No `insert`/`update`/`delete` policy for `authenticated` — rows are only written by the trigger. Promoting a user to `admin` is done manually via SQL in the Supabase dashboard for now.

The existing `inventory_items` table is untouched by this task.

## Auth Pages

- `/login` — email + password form, `supabase.auth.signInWithPassword`. On success, redirect to `/`. Inline error message on bad credentials.
- `/signup` — email + password form, `supabase.auth.signUp`. Since email confirmation is required (Supabase default, kept as-is), on success show a "check your email to confirm your account" message rather than redirecting as logged-in. Inline error on duplicate email / weak password.
- Both pages match existing site conventions: uppercase tracked labels, `ink`/`bone`/`brass` palette, form styling consistent with the checkout page.

## Navbar Integration

- `AuthProvider` (`src/lib/auth/auth-context.tsx`) — client context mirroring the existing `CartProvider` pattern. On mount, reads the current session via the browser client and subscribes to `onAuthStateChange` to stay in sync (e.g., after login/logout without a full reload).
- Wraps the app in `layout.tsx` alongside `CartProvider`.
- Navbar gets one additional small text link in the icon row:
  - Signed out: "Login" → `/login`.
  - Signed in: the user's email + a "Log out" action (calls `supabase.auth.signOut()` client-side, then refreshes).

## Error Handling

- Form-level inline errors surfaced from Supabase's returned error messages (invalid credentials, duplicate email, weak password, rate limiting).
- No silent failures: any `error` returned from an auth call is shown to the user, never swallowed.

## Testing

- Manual verification (no existing test suite in this project):
  1. Sign up a new test account → confirm the "check your email" message appears, and a row appears in `public.profiles` with `role = 'customer'`.
  2. Confirm the email (via Supabase dashboard or actual email) → log in → navbar shows email + Log out.
  3. Log out → navbar reverts to "Login".
  4. Attempt login with wrong password → inline error shown, no crash.
  5. Query `public.profiles` directly to confirm RLS blocks a different authenticated user from reading someone else's row (spot-check via SQL, not a full test harness).
