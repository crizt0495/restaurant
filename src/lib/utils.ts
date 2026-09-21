import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num)
}

function toDate(date: Date | string): Date {
  if (typeof date !== "string") return date
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number)
    return new Date(y, m - 1, d)
  }
  return new Date(date)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(toDate(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(date))
}

function localDateStamp(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, "0")
  const d = String(now.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

export function generateOrderNumber(): string {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `ORD-${localDateStamp()}-${random}`
}

export function generatePONumber(): string {
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `PO-${localDateStamp()}-${random}`
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export const STATUS_LABELS: Record<string, string> = {
  NEW: "Baru",
  CONFIRMED: "Dikonfirmasi",
  PREPARING: "Dibuat",
  READY: "Siap",
  SERVED: "Disajikan",
  COMPLETED: "Selesai",
  CANCELLED: "Dibatalkan",
  REFUNDED: "Dikembalikan",
  RECEIVED: "Diterima",
  PARTIAL: "Sebagian",
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  DRAFT: "Draf",
  OPEN: "Buka",
  CLOSED: "Tutup",
  SUBMITTED: "Dikirim",
  ADJUSTED: "Disesuaikan",
  SUCCESS: "Berhasil",
  FAILED: "Gagal",
  UNPAID: "Belum Bayar",
  PAID: "Lunas",
  REFUND: "Dikembalikan",
  AVAILABLE: "Tersedia",
  OCCUPIED: "Terisi",
  RESERVED: "Dipesan",
  WAITING_PAYMENT: "Menunggu Pembayaran",
  CLEANING: "Dibersihkan",
  OUT_OF_SERVICE: "Tidak Beroperasi",
  SEATED: "Duduk",
  NO_SHOW: "Tidak Hadir",
  RAW: "Bahan Baku",
  PACKAGING: "Kemasan",
  FINISHED_GOODS: "Barang Jadi",
  BRONZE: "Perunggu",
  SILVER: "Perak",
  GOLD: "Emas",
  PLATINUM: "Platinum",
}

export function translateStatus(code: string | null | undefined): string {
  if (!code) return "-"
  return STATUS_LABELS[code] ?? code
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-")
}

export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + "..."
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
