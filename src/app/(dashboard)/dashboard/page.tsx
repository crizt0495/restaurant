import { Suspense } from "react"
import { getCurrentUser, getDashboardMetrics } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { DashboardView } from "@/components/dashboard/dashboard-view"
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton"

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
        <h2 className="text-2xl font-bold">Dasbor</h2>
        <p className="text-sm text-muted-foreground">Ringkasan performa hari ini</p>
      </div>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLoader />
      </Suspense>
    </div>
  )
}
