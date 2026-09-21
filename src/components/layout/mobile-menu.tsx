"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { dashboardNav, type NavItem } from "@/config/navigation"
import { UtensilsCrossed } from "lucide-react"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"

interface MobileMenuProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  permissions: string[]
  isSuperAdmin: boolean
}

export function MobileMenu({ open, onOpenChange, permissions, isSuperAdmin }: MobileMenuProps) {
  const pathname = usePathname()

  const canView = (item: NavItem) => {
    if (isSuperAdmin) return true
    if (!item.permission) return true
    return permissions.includes("*") || permissions.includes(item.permission)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[85%] p-0 sm:max-w-sm">
        <div className="flex h-16 items-center gap-3 border-b border-border px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-brand text-primary-foreground shadow-lg">
            <UtensilsCrossed className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <div className="flex-1">
            <span className="block font-display text-lg font-bold tracking-tight leading-none">
              Resto<span className="text-primary">RMS</span>
            </span>
            <span className="block text-2xs font-medium tracking-wide text-muted-foreground">
              Manajemen Restoran
            </span>
          </div>
        </div>
        <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
        <nav className="max-h-[calc(100vh-4rem)] space-y-5 overflow-y-auto px-3 py-4">
          {dashboardNav.map((section) => {
            const items = section.items.filter(canView)
            if (items.length === 0) return null
            return (
              <div key={section.title} className="space-y-0.5">
                <div className="px-3 pb-1.5 pt-1">
                  <span className="text-2xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {section.title}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {items.map((item) => {
                    const Icon = item.icon
                    const active = pathname.startsWith(item.href)
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => onOpenChange(false)}
                        className={cn(
                          "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px] transition-transform duration-150 group-hover:scale-110",
                            active && "text-primary"
                          )}
                          strokeWidth={active ? 2.5 : 2}
                        />
                        <span className="flex-1 text-13">{item.title}</span>
                        {active && (
                          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.15)]" />
                        )}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>
      </SheetContent>
    </Sheet>
  )
}