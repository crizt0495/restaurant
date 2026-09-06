"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { Bell, Search } from "lucide-react"
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

export function Header({ profileId }: { profileId?: string | null }) {
  const pathname = usePathname()
  const router = useRouter()
  const title = pathname.split("/").filter(Boolean)[0] || "Dashboard"
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
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <h1 className="text-sm font-semibold capitalize">{title}</h1>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="ml-2 hidden h-8 w-72 items-center gap-2 rounded-md border bg-muted/40 px-3 text-left text-xs text-muted-foreground transition-colors hover:bg-muted md:flex"
        aria-label="Buka pencarian global"
      >
        <Search className="h-3.5 w-3.5" />
Cari pesanan, produk, pelanggan, pemasok...
        <kbd className="ml-auto rounded bg-background px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon" className="md:hidden" asChild aria-label="Buka pencarian">
          <span onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </span>
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label="Notifikasi">
          <Link href="/notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </Button>
      </div>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-xl">
          <DialogTitle className="sr-only">Pencarian Global</DialogTitle>
          <div className="flex items-center gap-2 border-b pb-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              autoFocus
              placeholder="Cari pesanan, produk, pelanggan, pemasok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">Esc</kbd>
          </div>
          <div className="max-h-80 overflow-y-auto py-2">
            {searching ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Mencari...</p>
            ) : searchQuery.length < 2 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Ketik minimal 2 karakter</p>
            ) : searchResults.length === 0 ? (
              <p className="py-6 text-center text-xs text-muted-foreground">Tidak ada hasil</p>
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
                      className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">{r.label}</p>
                        {r.sub && <p className="text-xs text-muted-foreground">{r.sub}</p>}
                      </div>
                      <span className="rounded bg-muted px-2 py-0.5 text-[10px] uppercase">{r.type}</span>
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