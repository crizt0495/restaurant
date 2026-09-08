"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { exportToCSV } from "@/lib/csv"
import { Download } from "lucide-react"

interface ProfitReportProps {
  summary: {
    revenue: number
    cogs: number
    itemsDiscount: number
    grossProfit: number
    operatingExpenses: number
    netProfit: number
    grossMargin: number
    netMargin: number
    dateFrom: string
    dateTo: string
  }
}

export function ProfitReport({ summary }: ProfitReportProps) {
  const router = useRouter()
  const [from, setFrom] = useState(summary.dateFrom)
  const [to, setTo] = useState(summary.dateTo)

  const handleFilter = () => {
    const params = new URLSearchParams()
    params.set("from", from)
    params.set("to", to)
    router.push(`/reports/profit?${params.toString()}`)
  }

  const exportCSV = () => {
    exportToCSV(
      "profit-loss.csv",
      ["Metrik", "Nilai"],
      [
        ["Pendapatan", summary.revenue],
        ["Diskon", summary.itemsDiscount],
        ["HPP", summary.cogs],
        ["Laba Kotor", summary.grossProfit],
        ["Margin Kotor %", `${summary.grossMargin.toFixed(1)}%`],
        ["Biaya Operasional", summary.operatingExpenses],
        ["Laba Bersih", summary.netProfit],
        ["Margin Bersih %", `${summary.netMargin.toFixed(1)}%`],
      ]
    )
  }

  const rows = [
    { label: "Pendapatan (Penjualan)", value: summary.revenue, bold: true },
    { label: "Diskon", value: summary.itemsDiscount, negative: true },
    { label: "HPP (Harga Pokok)", value: summary.cogs, negative: true },
    { label: "Laba Kotor", value: summary.grossProfit, bold: true },
    { label: "Margin Kotor %", percent: summary.grossMargin },
    { label: "Biaya Operasional", value: summary.operatingExpenses, negative: true },
    { label: "Laba Bersih", value: summary.netProfit, bold: true },
    { label: "Margin Bersih %", percent: summary.netMargin },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Laba Rugi</h2>
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Ringkasan laba rugi periode</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-1">
          <Label>Dari</Label>
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Sampai</Label>
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button onClick={handleFilter}>Filter</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pendapatan</p>
            <p className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{formatCurrency(summary.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Laba Kotor</p>
            <p className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{formatCurrency(summary.grossProfit)}</p>
            <p className="text-xs text-muted-foreground">{summary.grossMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Laba Bersih</p>
            <p className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{formatCurrency(summary.netProfit)}</p>
            <p className="text-xs text-muted-foreground">{summary.netMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Laporan Laba Rugi</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Metric</TableHead>
                <TableHead className="text-right">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className={r.bold ? "font-semibold" : ""}>{r.label}</TableCell>
                  <TableCell className={`text-right ${r.bold ? "font-semibold" : ""}`}>
                    {r.percent !== undefined
                      ? `${r.percent.toFixed(1)}%`
                      : formatCurrency(r.value ?? 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
