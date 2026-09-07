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
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter">Dasbor</h2>
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Ringkasan performa hari ini</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLoader />
      </Suspense>
    </div>
  )
}
