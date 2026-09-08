import { Suspense } from "react"
import { getCurrentUser, getDashboardMetrics } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

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
          <div className="mb-1 flex items-center gap-2">
            <span className="bg-primary px-2 py-0.5 text-[10px] font-black font-mono text-primary-foreground">LIVE</span>
            <span className="h-[3px] w-14 bg-foreground" />
          </div>
          <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Dasbor</h2>
          <p className="mt-1.5 text-sm font-bold text-muted-foreground uppercase tracking-wider">Ringkasan performa hari ini</p>
        </div>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLoader />
      </Suspense>
    </div>
  )
}
