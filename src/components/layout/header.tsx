"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search, Command } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  order: "bg-primary text-primary-foreground",
  product: "bg-secondary text-secondary-foreground",
  customer: "bg-accent text-accent-foreground",
  supplier: "bg-info text-info-foreground",
}

export function Header({ profileId }: { profileId?: string | null }) {
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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b-[3px] border-foreground bg-background/95 px-4 backdrop-blur md:px-6">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Halaman</span>
        <h1 className="text-base font-black uppercase tracking-tight leading-none mt-0.5">{title}</h1>
      </div>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-auto hidden h-10 w-72 items-center gap-2 border-2 border-foreground bg-background px-3 text-left text-xs font-bold uppercase tracking-wide transition-all duration-100 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_hsl(var(--brutal-ink))] md:flex"
        aria-label="Buka pencarian global"
      >
        <Search className="h-4 w-4" strokeWidth={3} />
        <span className="text-muted-foreground">Cari...</span>
        <kbd className="ml-auto flex items-center gap-1 border-2 border-foreground bg-muted px-1.5 py-0.5 text-[10px] font-mono font-bold">
          <Command className="h-3 w-3" strokeWidth={3} />K
        </kbd>
      </button>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden border-2 border-foreground" asChild aria-label="Buka pencarian">
          <span onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" strokeWidth={3} />
          </span>
        </Button>
        <Button variant="ghost" size="icon" className="relative border-2 border-foreground hover:bg-foreground hover:text-background" asChild aria-label="Notifikasi">
          <Link href="/notifications" className="relative">
            <Bell className="h-5 w-5" strokeWidth={3} />
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center bg-destructive text-destructive-foreground border-2 border-foreground px-1 text-[10px] font-black">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </Button>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">Pencarian Global</DialogTitle>
          <div className="flex items-center gap-3 -mx-6 -mt-6 px-6 py-4 border-b-[3px] border-foreground bg-foreground text-background">
            <Search className="h-5 w-5" strokeWidth={3} />
            <input
              autoFocus
              placeholder="Cari pesanan, produk, pelanggan, pemasok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-base font-bold placeholder:opacity-50 outline-none"
            />
            <kbd className="border-2 border-background bg-transparent px-2 py-1 text-[10px] font-mono font-bold">ESC</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {searching ? (
              <p className="py-6 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Mencari...</p>
            ) : searchQuery.length < 2 ? (
              <p className="py-6 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Ketik minimal 2 karakter</p>
            ) : searchResults.length === 0 ? (
              <p className="py-6 text-center text-xs font-bold uppercase tracking-wider text-muted-foreground">Tidak ada hasil</p>
            ) : (
              <ul className="space-y-2">
                {searchResults.map((r) => (
                  <li key={`${r.type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false)
                        router.push(r.href)
                      }}
                      className="flex w-full items-center justify-between gap-3 border-2 border-border px-3 py-2 text-left transition-all hover:border-foreground hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0_0_hsl(var(--brutal-ink))]"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm uppercase truncate">{r.label}</p>
                        {r.sub && <p className="text-xs text-muted-foreground font-mono truncate">{r.sub}</p>}
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-wider border-2 border-foreground ${typeColors[r.type]}`}>
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
