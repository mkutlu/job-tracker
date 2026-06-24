import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const profile = await prisma.profile.findUnique({ where: { userId: user.id } })
  if (!profile) redirect("/onboarding")

  return (
    <DashboardShell
      profile={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        currentTitle: profile.currentTitle ?? undefined,
        jobStatus: profile.jobStatus,
        email: user.email!,
      }}
    >
      {children}
    </DashboardShell>
  )
}