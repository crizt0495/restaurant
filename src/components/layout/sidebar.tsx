"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { dashboardNav, type NavItem } from "@/config/navigation"
import { UtensilsCrossed } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"

interface SidebarProps {
  user?: {
    full_name: string
    role: string
    username: string
    avatar_url?: string
  } | null
  permissions: string[]
  isSuperAdmin: boolean
}

export function Sidebar({ user, permissions, isSuperAdmin }: SidebarProps) {
  const pathname = usePathname()

  const canView = (item: NavItem) => {
    if (isSuperAdmin) return true
    if (!item.permission) return true
    return permissions.includes("*") || permissions.includes(item.permission)
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r bg-background lg:flex">
      <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="brutal-primary brutal-active flex h-9 w-9 items-center justify-center rounded-md">
          <UtensilsCrossed className="h-4 w-4" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">RMS</span>
      </div>

      <nav className="flex-1 space-y-2 overflow-y-auto p-3">
        {dashboardNav.map((section) => {
          const items = section.items.filter(canView)
          if (items.length === 0) return null
          return (
            <div key={section.title} className="space-y-1">
              <p className="px-2 pt-4 text-xs font-medium text-muted-foreground">
                {section.title}
              </p>
              {items.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.title}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center justify-between">
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}