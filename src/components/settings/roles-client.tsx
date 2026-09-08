"use client"

import * as React from "react"
import { setRolePermission } from "@/lib/actions/index"
import { PERMISSION_MATRIX } from "@/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import toast from "react-hot-toast"
import { Shield, Loader2 } from "lucide-react"
import type { Role } from "@/types"

interface PermissionRow {
  id: string
  key: string
  name: string
  module: string
}

interface RolePermRow {
  id: string
  role: string
  permission_id: string
  permissions?: PermissionRow | null
}

interface RolesClientProps {
  roles: Role[]
  permissions: PermissionRow[]
  rolePermissions: RolePermRow[]
}

export function RolesClient({ roles, permissions, rolePermissions }: RolesClientProps) {
  const [rpState, setRpState] = React.useState(rolePermissions)
  const [savingKey, setSavingKey] = React.useState<string | null>(null)

  React.useEffect(() => {
    setRpState(rolePermissions)
  }, [rolePermissions])

  const modules = React.useMemo(() => {
    const grouped: Record<string, typeof PERMISSION_MATRIX> = {}
    for (const pm of PERMISSION_MATRIX) {
      if (!grouped[pm.module]) grouped[pm.module] = []
      grouped[pm.module].push(pm)
    }
    return grouped
  }, [])

  const isPermissionEnabled = (role: string, permissionKey: string) => {
    return (
      role === "SUPER_ADMIN" ||
      rpState.some(
        (rp) =>
          rp.role === role &&
          (rp.permissions?.key === permissionKey || rp.permission_id === permissionKey)
      )
    )
  }

  const handleToggle = async (role: string, permissionKey: string) => {
    const currentlyEnabled = isPermissionEnabled(role, permissionKey)
    const newEnabled = !currentlyEnabled
    const saveKey = `${role}:${permissionKey}`

    setSavingKey(saveKey)

    // optimistic update
    if (newEnabled) {
      setRpState((prev) => [
        ...prev,
        {
          id: `temp-${role}-${permissionKey}`,
          role,
          permission_id: permissionKey,
          permissions: { id: permissionKey, key: permissionKey, name: "", module: "" },
        },
      ])
    } else {
      setRpState((prev) =>
        prev.filter(
          (rp) =>
            !(
              rp.role === role &&
              (rp.permissions?.key === permissionKey || rp.permission_id === permissionKey)
            )
        )
      )
    }

    const permRecord = permissions.find((p) => p.key === permissionKey)
    const result = await setRolePermission(role, permRecord?.id ?? permissionKey, newEnabled)

    setSavingKey(null)

    if (result.error) {
      toast.error(result.error)
      setRpState(rolePermissions)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-3xl font-black uppercase tracking-tighter leading-none">Peran & Izin</h2>
        <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kelola hak akses per role</p>
      </div>

      <Tabs defaultValue={roles[0]}>
        <TabsList className="flex flex-wrap h-auto gap-1">
          {roles.map((role) => (
            <TabsTrigger key={role} value={role}>
              <Shield className="mr-1 h-3 w-3" />
              {role}
            </TabsTrigger>
          ))}
        </TabsList>

        {roles.map((role) => (
          <TabsContent key={role} value={role}>
            <div className="space-y-4">
              {Object.entries(modules).map(([module, perms]) => (
                <Card key={module}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {module}
                      <Badge variant="secondary" className="text-xs">
                        {perms.filter((p) => isPermissionEnabled(role, p.key)).length}/
                        {perms.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {perms.map((pm) => (
                        <label
                          key={pm.key}
                          className="flex items-center gap-2 border-2 border-foreground bg-card px-3 py-2 text-sm cursor-pointer shadow-[3px_3px_0_0_hsl(var(--foreground))] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0_0_hsl(var(--foreground))] transition-all duration-150"
                        >
                          <Checkbox
                            checked={isPermissionEnabled(role, pm.key)}
                            disabled={savingKey === `${role}:${pm.key}` || role === "SUPER_ADMIN"}
                            onCheckedChange={() => role !== "SUPER_ADMIN" && handleToggle(role, pm.key)}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{pm.name}</span>
                            {pm.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {pm.description}
                              </p>
                            )}
                          </div>
                          {savingKey === `${role}:${pm.key}` && (
                            <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                          )}
                        </label>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
