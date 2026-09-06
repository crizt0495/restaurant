"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils"
import { exportToCSV } from "@/lib/csv"
import { Download } from "lucide-react"

interface SalesReportProps {
  summary: {
    totalSales: number
    orderCount: number
    totalItems: number
    avgOrder: number
    dateFrom: string
    dateTo: string
  }
  dailySales: { date: string; orders: number; revenue: number }[]
  paymentBreakdown: { method: string; amount: number }[]
}

export function SalesReport({ summary, dailySales, paymentBreakdown }: SalesReportProps) {
  const router = useRouter()
  const [from, setFrom] = useState(summary.dateFrom)
  const [to, setTo] = useState(summary.dateTo)

  const handleFilter = () => {
    const params = new URLSearchParams()
    params.set("from", from)
    params.set("to", to)
    router.push(`/reports/sales?${params.toString()}`)
  }

  const exportDailyCSV = () => {
    exportToCSV(
      "sales-daily.csv",
      ["Tanggal", "Pesanan", "Pendapatan"],
      dailySales.map((d) => [d.date, d.orders, d.revenue])
    )
  }

  const exportPaymentCSV = () => {
    exportToCSV(
      "sales-payment-methods.csv",
      ["Metode", "Jumlah"],
      paymentBreakdown.map((p) => [p.method, p.amount])
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Laporan Penjualan</h2>
        <p className="text-sm text-muted-foreground">Ringkasan penjualan periode</p>
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Penjualan</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.totalSales)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Orders</p>
            <p className="text-2xl font-bold">{formatNumber(summary.orderCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Item</p>
            <p className="text-2xl font-bold">{formatNumber(summary.totalItems)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Rata-rata Pesanan</p>
            <p className="text-2xl font-bold">{formatCurrency(summary.avgOrder)}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Penjualan per Hari</CardTitle>
          <Button variant="outline" size="sm" onClick={exportDailyCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {dailySales.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data penjualan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Pesanan</TableHead>
                  <TableHead className="text-right">Pendapatan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailySales.map((d) => (
                  <TableRow key={d.date}>
                    <TableCell>{formatDate(d.date)}</TableCell>
                    <TableCell className="text-right">{formatNumber(d.orders)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(d.revenue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Metode Pembayaran</CardTitle>
          <Button variant="outline" size="sm" onClick={exportPaymentCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {paymentBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data pembayaran</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Metode</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paymentBreakdown.map((p) => (
                  <TableRow key={p.method}>
                    <TableCell>{p.method}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
