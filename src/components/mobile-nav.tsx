"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { bottomNav, type NavItem } from "@/config/navigation"

interface MobileNavProps {
  permissions: string[]
  isSuperAdmin: boolean
}

export function MobileNav({ permissions, isSuperAdmin }: MobileNavProps) {
  const pathname = usePathname()

  const canView = (item: NavItem) => {
    if (isSuperAdmin) return true
    if (!item.permission) return true
    return permissions.includes("*") || permissions.includes(item.permission)
  }

  const isActive = (item: NavItem) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)

  return (
    <nav className="glass-strong fixed inset-x-0 bottom-0 z-40 border-t border-border pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex items-stretch justify-around">
        {bottomNav.filter(canView).map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-primary" />
              )}
              <Icon className={cn("h-5 w-5", active && "text-primary")} strokeWidth={active ? 2.5 : 2} />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}