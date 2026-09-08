"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { exportToCSV } from "@/lib/csv"
import { Download, AlertTriangle } from "lucide-react"

interface InventoryItem {
  id: string
  name: string
  sku: string
  unit: string
  quantity: number
  minimum_stock: number
  cost_price: number
  stock_value: number
  is_low_stock: boolean
}

interface InventoryReportProps {
  items: InventoryItem[]
  totalStockValue: number
}

export function InventoryReport({ items, totalStockValue }: InventoryReportProps) {
  const [showReorderOnly, setShowReorderOnly] = useState(false)

  const filtered = showReorderOnly ? items.filter((i) => i.is_low_stock) : items

  const exportCSV = () => {
    exportToCSV(
      "inventory-report.csv",
      ["Nama", "SKU", "Unit", "Jumlah", "Stok Min", "Harga Pokok", "Nilai Stok"],
      filtered.map((i) => [i.name, i.sku, i.unit, i.quantity, i.minimum_stock, i.cost_price, i.stock_value])
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Laporan Persediaan</h2>
        <p className="text-sm text-muted-foreground">Stock dan valuasi inventaris</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Nilai Stok</p>
            <p className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{formatCurrency(totalStockValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Item</p>
            <p className="font-display text-3xl font-black uppercase tracking-tighter leading-none">{formatNumber(items.length)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Item Stok Rendah</p>
            <p className="font-display text-3xl font-black text-destructive leading-none">
              {formatNumber(items.filter((i) => i.is_low_stock).length)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <CardTitle>Daftar Stok</CardTitle>
            <Button
              variant={showReorderOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowReorderOnly(!showReorderOnly)}
            >
              <AlertTriangle className="h-4 w-4 mr-1" />
              Daftar Pemesanan Ulang
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data inventaris</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Jumlah</TableHead>
                  <TableHead className="text-right">Stok Min</TableHead>
                  <TableHead className="text-right">Harga Pokok</TableHead>
                  <TableHead className="text-right">Nilai Stok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.is_low_stock ? "bg-destructive/5" : ""}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.name}
                        {item.is_low_stock && (
                          <Badge variant="destructive" className="text-[10px]">RENDAH</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.sku}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.quantity)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.minimum_stock)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.cost_price)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.stock_value)}</TableCell>
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
