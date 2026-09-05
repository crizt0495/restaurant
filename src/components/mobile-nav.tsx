"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { bottomNav, type NavItem } from "@/config/navigation"

export function MobileNav() {
  const pathname = usePathname()

  const isActive = (item: NavItem) =>
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background lg:hidden">
      <div className="flex items-center justify-around">
        {bottomNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-16 w-full flex-col items-center justify-center gap-1 text-xs",
                active ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}