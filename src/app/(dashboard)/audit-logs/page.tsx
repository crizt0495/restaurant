import { getCurrentUser } from "@/lib/helpers"
import { redirect } from "next/navigation"
import { getAuditLogs } from "@/lib/queries"
import { AuditLogsClient } from "@/components/audit/audit-logs-client"

export const dynamic = "force-dynamic"

export default async function AuditLogsPage() {
  const user = await getCurrentUser()
  if (!user || (!user.is_super_admin && !user.permissions.includes("audit.view"))) {
    redirect("/dashboard")
  }

  const logs = await getAuditLogs()

  return <AuditLogsClient logs={logs} />
}