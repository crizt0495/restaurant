"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency, formatNumber } from "@/lib/utils"
import { exportToCSV } from "@/lib/csv"
import { Download } from "lucide-react"

interface CustomerRow {
  id: string
  name: string
  phone: string
  member_level: string
  points: number
  total_spent: number
  is_member: boolean
}

interface CustomersReportProps {
  customers: CustomerRow[]
  totalSpent: number
  memberCount: number
}

export function CustomersReport({ customers, totalSpent, memberCount }: CustomersReportProps) {
  const exportCSV = () => {
    exportToCSV(
      "customers-report.csv",
      ["Name", "Phone", "Member Level", "Points", "Total Spent"],
      customers.map((c) => [c.name, c.phone, c.member_level, c.points, c.total_spent])
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Customer Report</h2>
        <p className="text-sm text-muted-foreground">Performa pelanggan dan loyalitas</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Customers</p>
            <p className="text-2xl font-bold">{formatNumber(customers.length)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Members</p>
            <p className="text-2xl font-bold">{formatNumber(memberCount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Revenue from Customers</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Top Customers</CardTitle>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {customers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Tidak ada data pelanggan</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((c, idx) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.phone || "-"}</TableCell>
                    <TableCell>
                      {c.is_member ? (
                        <Badge variant="info">{c.member_level}</Badge>
                      ) : (
                        <Badge variant="neutral">Non-Member</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(c.points)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(c.total_spent)}</TableCell>
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
