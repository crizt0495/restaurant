"use client"

import * as React from "react"
import { formatDateTime } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Search, Activity } from "lucide-react"
import { Input } from "@/components/ui/input"

interface AuditLog {
  id: string
  action: string
  entity: string
  entity_id: string | null
  old_data: any
  new_data: any
  ip: string | null
  user_agent: string | null
  created_at: string
  profiles?: { full_name: string; username: string } | null
}

const ACTION_VARIANT: Record<string, "default" | "info" | "warning" | "success" | "destructive" | "neutral"> = {
  CREATE: "success",
  UPDATE: "info",
  DELETE: "destructive",
  LOGIN: "info",
  LOGOUT: "neutral",
  VOID: "warning",
  REFUND: "warning",
  CLOSE_SHIFT: "info",
  DISCOUNT: "warning",
  APPROVAL: "success",
  STOCK_ADJUSTMENT: "info",
}

export function AuditLogsClient({ logs: initial }: { logs: AuditLog[] }) {
  const [logs, setLogs] = React.useState<AuditLog[]>(initial)
  const [search, setSearch] = React.useState("")
  const [actionFilter, setActionFilter] = React.useState("")

  React.useEffect(() => {
    setLogs(initial)
  }, [initial])

  const filtered = logs.filter((l) => {
    const matchAction = !actionFilter || l.action === actionFilter
    const matchSearch =
      !search ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      (l.entity_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (l.profiles?.full_name || "").toLowerCase().includes(search.toLowerCase())
    return matchAction && matchSearch
  })

  const allActions = Array.from(new Set(logs.map((l) => l.action))).sort()

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">Log Audit</h2>
        <p className="text-sm text-muted-foreground">Catatan aktivitas sistem</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari entity, user, action..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="h-9 rounded-md border bg-background px-3 text-sm"
          aria-label="Filter action"
        >
          <option value="">Semua Aksi</option>
          {allActions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Activity className="mx-auto mb-2 h-8 w-8" />
            <p>Belum ada aktivitas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">{formatDateTime(l.created_at)}</TableCell>
                  <TableCell className="font-medium">
                    {l.profiles?.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ACTION_VARIANT[l.action] || "neutral"}>{l.action}</Badge>
                  </TableCell>
                  <TableCell>{l.entity}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.entity_id ? l.entity_id.slice(0, 8) + "..." : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ip || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}