"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface PaginationProps {
  totalItems: number
  itemsPerPage: number
  currentPage: number
  onPageChange: (page: number) => void
}

export function Pagination({ totalItems, itemsPerPage, currentPage, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
  const from = Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)
  const to = Math.min(currentPage * itemsPerPage, totalItems)

  const getPages = React.useMemo(() => {
    const pages: (number | string)[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (currentPage > 3) pages.push("...")
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (currentPage < totalPages - 2) pages.push("...")
      pages.push(totalPages)
    }
    return pages
  }, [currentPage, totalPages])

  return (
    <div className="flex flex-col items-center justify-between gap-3 px-1 py-4 text-sm sm:flex-row">
      <span className="text-sm text-muted-foreground">
        Menampilkan <span className="font-semibold text-foreground">{from}–{to}</span> dari{" "}
        <span className="font-semibold text-foreground">{totalItems}</span>
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {getPages.map((p, i) =>
          typeof p === "string" ? (
            <span key={`ellipsis-${i}`} className="px-1 text-sm text-muted-foreground">…</span>
          ) : (
            <Button
              key={p}
              variant={p === currentPage ? "default" : "outline"}
              size="icon"
              className={cn("h-9 w-9", p === currentPage && "font-semibold")}
              onClick={() => onPageChange(p)}
              aria-label={`Halaman ${p}`}
              aria-current={p === currentPage ? "page" : undefined}
            >
              {p}
            </Button>
          )
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Halaman berikutnya"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}