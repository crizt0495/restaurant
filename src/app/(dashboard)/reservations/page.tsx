import { getCurrentUser } from "@/lib/helpers"
import { getReservations, getTables } from "@/lib/queries"
import { ReservationsClient } from "@/components/reservations/reservations-client"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ReservationsPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("reservations.view"))) {
    redirect("/dashboard")
  }

  const [reservations, tables] = await Promise.all([getReservations(), getTables()])

  return (
    <ReservationsClient
      reservations={reservations}
      tables={tables}
      canCreate={user.is_super_admin || user.permissions.includes("reservations.create")}
      canEdit={user.is_super_admin || user.permissions.includes("reservations.create")}
    />
  )
}
