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
      ["Metric", "Value"],
      [
        ["Revenue", summary.revenue],
        ["Discount", summary.itemsDiscount],
        ["COGS", summary.cogs],
        ["Gross Profit", summary.grossProfit],
        ["Gross Margin %", `${summary.grossMargin.toFixed(1)}%`],
        ["Operating Expenses", summary.operatingExpenses],
        ["Net Profit", summary.netProfit],
        ["Net Margin %", `${summary.netMargin.toFixed(1)}%`],
      ]
    )
  }

  const rows = [
    { label: "Revenue (Penjualan)", value: summary.revenue, bold: true },
    { label: "Discount", value: summary.itemsDiscount, negative: true },
    { label: "COGS (Harga Pokok)", value: summary.cogs, negative: true },
    { label: "Gross Profit", value: summary.grossProfit, bold: true },
    { label: "Gross Margin %", percent: summary.grossMargin },
    { label: "Operating Expenses", value: summary.operatingExpenses, negative: true },
    { label: "Net Profit", value: summary.netProfit, bold: true },
    { label: "Net Margin %", percent: summary.netMargin },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Profit & Loss</h2>
        <p className="text-sm text-muted-foreground">Ringkasan laba rugi periode</p>
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
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.revenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Gross Profit</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.grossProfit)}</p>
            <p className="text-xs text-muted-foreground">{summary.grossMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.netProfit)}</p>
            <p className="text-xs text-muted-foreground">{summary.netMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profit & Loss Statement</CardTitle>
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
