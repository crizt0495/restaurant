import { Suspense } from "react"
import { getCurrentUser, getDashboardMetrics } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"
import { Badge } from "@/components/ui/badge"

export const revalidate = 5

async function DashboardDataLoader() {
  const data = await getDashboardMetrics()
  return <DashboardView initialData={data} />
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between animate-brutal-slide-up">
        <div>
          <Badge variant="default" className="mb-2 gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
            </span>
            LIVE
          </Badge>
          <h2 className="font-display text-2xl font-bold tracking-tight md:text-3xl leading-none">Dasbor</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Ringkasan performa hari ini</p>
        </div>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLoader />
      </Suspense>
    </div>
  )
}
