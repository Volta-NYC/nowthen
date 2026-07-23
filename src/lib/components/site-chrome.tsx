"use client"

import { usePathname } from "next/navigation"
import Navbar from "./navbar"
import Footer from "./footer"
import CartDrawer from "./cart-drawer"
import ScrollProgress from "./scroll-progress"

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname?.startsWith("/admin") ?? false

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <ScrollProgress />
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
    </>
  )
}
