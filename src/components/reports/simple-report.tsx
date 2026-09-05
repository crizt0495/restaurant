"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { exportToCSV } from "@/lib/csv"
import { Download, Printer, FileText } from "lucide-react"

interface SimpleReportProps {
  title: string
  description: string
  dateFrom: string
  dateTo: string
  columns: { key: string; label: string }[]
  rows: Record<string, string | number>[]
  summary?: { label: string; value: string }[]
}

export function SimpleReport({ title, description, dateFrom, dateTo, columns, rows, summary }: SimpleReportProps) {
  const router = useRouter()
  const [from, setFrom] = useState(dateFrom)
  const [to, setTo] = useState(dateTo)

  const handleFilter = () => {
    const params = new URLSearchParams()
    params.set("from", from)
    params.set("to", to)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  const exportCSV = () => {
    exportToCSV(
      `${title.toLowerCase().replace(/\s+/g, "-")}.csv`,
      columns.map((c) => c.label),
      rows.map((r) => columns.map((c) => r[c.key] ?? ""))
    )
  }

  return (
    <div className="space-y-6">
      <div className="print:mb-0">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="no-print flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={handleFilter}>Filter</Button>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={rows.length === 0}>
            <Download className="h-4 w-4 mr-1" /> CSV
          </Button>
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>
      </div>

      {summary && summary.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summary.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="mt-1 text-xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Detail ({rows.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada data</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {columns.map((c) => (
                      <TableHead key={c.key}>{c.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r, i) => (
                    <TableRow key={i}>
                      {columns.map((c) => (
                        <TableCell key={c.key}>{r[c.key] ?? "-"}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}