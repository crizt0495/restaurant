"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { exportToCSV } from "@/lib/csv"
import { Download } from "lucide-react"

interface ProductRow {
  product_id: string
  product_name: string
  qty_sold: number
  revenue: number
  unit: string
}

interface ProductsReportProps {
  products: ProductRow[]
  dateFrom: string
  dateTo: string
}

export function ProductsReport({ products, dateFrom, dateTo }: ProductsReportProps) {
  const router = useRouter()
  const [from, setFrom] = useState(dateFrom)
  const [to, setTo] = useState(dateTo)

  const handleFilter = () => {
    const params = new URLSearchParams()
    params.set("from", from)
    params.set("to", to)
    router.push(`/reports/products?${params.toString()}`)
  }

  const exportCSV = () => {
    exportToCSV(
      "products-report.csv",
      ["Product", "Qty Sold", "Revenue"],
      products.map((p) => [p.product_name, p.qty_sold, p.revenue])
    )
  }

  const totalRevenue = products.reduce((s, p) => s + p.revenue, 0)
  const totalQty = products.reduce((s, p) => s + p.qty_sold, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Product Report</h2>
        <p className="text-sm text-muted-foreground">Produk terlaris dan performa</p>
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-2xl font-bold">{formatCurrency(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Items Sold</p>
            <p className="text-2xl font-bold">{formatNumber(totalQty)}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Products by Revenue</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data penjualan produk</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Qty Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, idx) => (
                  <TableRow key={p.product_id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>{p.product_name}</TableCell>
                    <TableCell className="text-right">{formatNumber(p.qty_sold)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
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
