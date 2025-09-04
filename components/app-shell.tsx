"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/appointments/new", label: "New Appointment" },
  { href: "/services", label: "Services" },
  { href: "/technicians", label: "Technicians" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/dashboard" className="font-semibold text-lg text-balance">
            Vehicle Services
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "text-sm px-2 py-1 rounded-md hover:bg-muted transition",
                  pathname?.startsWith(n.href) ? "bg-muted font-medium" : "text-muted-foreground",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  )
}
