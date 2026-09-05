import { getCurrentUser } from "@/lib/helpers"
import { Sidebar } from "@/components/layout/sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { Header } from "@/components/layout/header"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar
        user={{
          full_name: user.full_name,
          role: user.role,
          username: user.username,
        }}
        permissions={user.permissions}
        isSuperAdmin={user.is_super_admin}
      />
      <div className="flex min-h-screen flex-col lg:pl-64">
        <Header />
        <main className="flex-1 p-4 pb-20 lg:pb-6 md:p-6">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  )
}