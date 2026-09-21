"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

interface SearchResult {
  type: "order" | "product" | "customer" | "supplier"
  id: string
  label: string
  sub?: string
  href: string
}

const typeColors: Record<SearchResult["type"], string> = {
  order: "bg-primary/10 text-primary border-primary/20",
  product: "bg-secondary/60 text-secondary-foreground border-border",
  customer: "bg-accent/10 text-accent border-accent/20",
  supplier: "bg-info/10 text-info border-info/20",
}

interface HeaderProps {
  profileId?: string | null
  user?: {
    full_name: string
    role: string
    username: string
    avatar_url?: string
  } | null
}

export function Header({ profileId, user }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const segments = pathname.split("/").filter(Boolean)
  const title = segments[0] || "Dashboard"
  const [unread, setUnread] = React.useState(0)
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [searchResults, setSearchResults] = React.useState<SearchResult[]>([])
  const [searching, setSearching] = React.useState(false)

  React.useEffect(() => {
    const supabase = createClient()
    const pid = profileId
    if (pid) {
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .or(`user_id.is.null,user_id.eq.${pid}`)
        .eq("is_read", false)
        .then(({ count }) => setUnread(count ?? 0))
    }

    const channel = supabase
      .channel("header-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        if (!pid) return
        supabase
          .from("notifications")
          .select("id", { count: "exact", head: true })
          .or(`user_id.is.null,user_id.eq.${pid}`)
          .eq("is_read", false)
          .then(({ count }) => setUnread(count ?? 0))
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profileId])

  const runSearch = React.useCallback(async (query: string) => {
    const supabase = createClient()
    const q = `%${query}%`
    const [orders, products, customers, suppliers] = await Promise.all([
      supabase.from("orders").select("id, order_number, total").or(`order_number.ilike.${q}`).limit(5),
      supabase.from("products").select("id, name, sku").or(`name.ilike.${q},sku.ilike.${q}`).eq("is_active", true).is("deleted_at", null).limit(5),
      supabase.from("customers").select("id, name, phone").or(`name.ilike.${q},phone.ilike.${q}`).is("deleted_at", null).limit(5),
      supabase.from("suppliers").select("id, name, company").or(`name.ilike.${q},company.ilike.${q}`).is("deleted_at", null).limit(5),
    ])

    const results: SearchResult[] = []
    for (const o of orders.data ?? []) {
      results.push({ type: "order", id: o.id, label: o.order_number, sub: `Rp ${Number(o.total).toLocaleString("id-ID")}`, href: `/orders/${o.id}` })
    }
    for (const p of products.data ?? []) {
      results.push({ type: "product", id: p.id, label: p.name, sub: p.sku, href: `/products` })
    }
    for (const c of customers.data ?? []) {
      results.push({ type: "customer", id: c.id, label: c.name, sub: c.phone || undefined, href: `/customers` })
    }
    for (const s of suppliers.data ?? []) {
      results.push({ type: "supplier", id: s.id, label: s.name, sub: s.company || undefined, href: `/suppliers` })
    }
    setSearchResults(results)
    setSearching(false)
  }, [])

  React.useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    const t = setTimeout(() => {
      void runSearch(searchQuery)
    }, 250)
    return () => clearTimeout(t)
  }, [searchQuery, runSearch])

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setSearchOpen(true)
        setSearchQuery("")
        setSearchResults([])
      } else if (e.key === "Escape" && searchOpen) {
        setSearchOpen(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [searchOpen])

  const titleLabel = title.replace(/-/g, " ")

  return (
    <header className="glass sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border px-4 md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-col">
          <span className="text-3xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {titleLabel}
          </span>
          <h1 className="text-lg font-bold tracking-tight leading-none mt-0.5">{titleLabel}</h1>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto hidden h-9 w-72 items-center gap-2 rounded-lg border border-border bg-card/70 px-3 text-left text-sm text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-foreground md:flex"
        aria-label="Buka pencarian global"
      >
        <Search className="h-4 w-4" />
        <span>Cari pesanan, produk, pelanggan...</span>
        <kbd className="ml-auto flex h-6 items-center gap-1 rounded-md border border-border bg-muted px-1.5 font-mono text-3xs font-bold text-muted-foreground">
          <Command className="h-3 w-3" />K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-1.5 md:ml-0">
        <Button variant="ghost" size="icon" className="md:hidden text-muted-foreground" onClick={() => setSearchOpen(true)} aria-label="Buka pencarian">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground" asChild aria-label="Notifikasi">
          <Link href="/notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-3xs font-bold text-destructive-foreground ring-2 ring-background animate-brutal-pop">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </Button>
        <div className="lg:hidden">
          <ThemeToggle />
        </div>
        <div className="lg:hidden">
          <UserMenu user={user} triggerClassName="w-auto" />
        </div>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">Pencarian Global</DialogTitle>
          <div className="flex items-center gap-3 pb-3">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Cari pesanan, produk, pelanggan, pemasok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground/60"
            />
            <kbd className="rounded-md border border-border bg-muted px-2 py-1 font-mono text-3xs font-bold text-muted-foreground">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {searching ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Mencari...</p>
            ) : searchQuery.length < 2 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Ketik minimal 2 karakter</p>
            ) : searchResults.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada hasil</p>
            ) : (
              <ul className="space-y-1">
                {searchResults.map((r) => (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false)
                        router.push(r.href)
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{r.label}</p>
                        {r.sub && <p className="truncate font-mono text-xs text-muted-foreground">{r.sub}</p>}
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-3xs font-semibold uppercase tracking-wider ${typeColors[r.type]}`}>
                        {r.type}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  )
}