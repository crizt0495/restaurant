"use client"

import * as React from "react"
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/index"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import toast from "react-hot-toast"
import {
  Bell,
  CheckCheck,
  Check,
  Info,
  AlertTriangle,
  Package,
  ShoppingCart,
  Settings,
  CreditCard,
} from "lucide-react"
import type { Notification } from "@/types"

interface NotificationsClientProps {
  notifications: Notification[]
  unread: number
}

const typeIcons: Record<string, React.ReactNode> = {
  new_order: <ShoppingCart className="h-4 w-4" />,
  stock_low: <Package className="h-4 w-4" />,
  info: <Info className="h-4 w-4" />,
  warning: <AlertTriangle className="h-4 w-4" />,
  payment: <CreditCard className="h-4 w-4" />,
  system: <Settings className="h-4 w-4" />,
}

function relativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return "Baru saja"
  if (diffMin < 60) return `${diffMin} menit lalu`
  if (diffHr < 24) return `${diffHr} jam lalu`
  if (diffDay < 7) return `${diffDay} hari lalu`
  return date.toLocaleDateString("id-ID")
}

export function NotificationsClient({ notifications: initial, unread: initialUnread }: NotificationsClientProps) {
  const [items, setItems] = React.useState<Notification[]>(initial)
  const [unreadCount, setUnreadCount] = React.useState(initialUnread)

  React.useEffect(() => {
    setItems(initial)
    setUnreadCount(initialUnread)
  }, [initial, initialUnread])

  React.useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification
          setItems((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)
          toast(newNotif.title)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleMarkRead = async (id: string) => {
    const result = await markNotificationRead(id)
    if (result.error) {
      toast.error(result.error)
      return
    }
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const handleMarkAllRead = async () => {
    const result = await markAllNotificationsRead()
    if (result.error) {
      toast.error(result.error)
      return
    }
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
    toast.success("Semua notifikasi ditandai sudah dibaca")
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifikasi</h2>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? (
              <Badge variant="warning">{unreadCount} belum dibaca</Badge>
            ) : (
              "Semua sudah dibaca"
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCheck className="mr-2 h-4 w-4" /> Tandai semua dibaca
          </Button>
        )}
      </div>

      <Separator />

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Bell className="mx-auto mb-2 h-8 w-8" />
            <p>Tidak ada notifikasi</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <Card
              key={n.id}
              className={n.is_read ? "opacity-60" : ""}
            >
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  {typeIcons[n.type] || <Info className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{n.title}</span>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <span className="text-xs text-muted-foreground">
                    {relativeTime(n.created_at)}
                  </span>
                </div>
                {!n.is_read && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => handleMarkRead(n.id)}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
