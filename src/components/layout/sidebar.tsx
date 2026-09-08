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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r-[3px] border-foreground bg-background lg:flex">
      <div className="flex h-20 items-center gap-3 border-b-[3px] border-foreground px-5 bg-foreground text-background">
        <div className="relative">
          <div className="flex h-11 w-11 items-center justify-center bg-primary text-primary-foreground border-2 border-foreground shadow-[3px_3px_0_0_hsl(var(--accent))]">
            <UtensilsCrossed className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="absolute -right-1 -top-1 h-3 w-3 bg-accent border-2 border-foreground" />
        </div>
        <div className="flex-1">
          <span className="block font-display text-xl font-black uppercase tracking-tighter leading-none">Resto</span>
          <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-primary">Manager v2</span>
        </div>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto p-4 brutal-dots">
        {dashboardNav.map((section, sIdx) => {
          const items = section.items.filter(canView)
          if (items.length === 0) return null
          return (
            <div key={section.title} className="space-y-1.5">
              <div className="flex items-center gap-2 px-2 pt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">
                  {section.title}
                </span>
                <div className="h-[3px] flex-1 bg-foreground" />
                <span className="text-[10px] font-mono font-black text-muted-foreground">
                  {String(sIdx + 1).padStart(2, "0")}
                </span>
              </div>
              {items.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "group relative flex items-center gap-3 px-3 py-2.5 text-sm font-black uppercase tracking-wide border-2 transition-all duration-150",
                      active
                        ? "bg-foreground text-background border-foreground shadow-[3px_3px_0_0_hsl(var(--primary))] translate-x-[-1px] translate-y-[-1px]"
                        : "border-transparent text-foreground hover:bg-muted hover:border-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_hsl(var(--foreground))]"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 transition-transform group-hover:scale-110",
                        active && "text-primary"
                      )}
                      strokeWidth={2.5}
                    />
                    <span className="flex-1">{item.title}</span>
                    {active && (
                      <span className="h-2 w-2 bg-primary animate-brutal-bounce" />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="border-t-[3px] border-foreground p-3 bg-muted">
        <div className="flex items-center justify-between gap-2">
          <UserMenu user={user} />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
