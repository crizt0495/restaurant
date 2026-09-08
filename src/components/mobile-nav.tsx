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
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t-[3px] border-foreground bg-background lg:hidden">
      <div className="flex items-stretch justify-around">
        {bottomNav.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex h-16 w-full flex-col items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider transition-colors",
                active ? "bg-foreground text-background" : "text-foreground hover:bg-muted"
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-10 bg-primary animate-brutal-pop" />
              )}
              <Icon className="h-5 w-5" strokeWidth={active ? 3 : 2.5} />
              {item.title}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
