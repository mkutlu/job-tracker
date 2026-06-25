import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { JobsClient } from "@/components/jobs/jobs-client"

export default async function JobsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-4 sm:p-8">
      <Suspense fallback={<div className="animate-pulse h-96 rounded-xl bg-muted" />}>
        <JobsClient jobs={jobs} />
      </Suspense>
    </div>
  )
}
