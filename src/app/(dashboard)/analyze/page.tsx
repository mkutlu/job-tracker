import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getSavedJobsForAnalysis } from "@/app/actions/analyze"
import { AnalyzeClient } from "@/components/analyze/analyze-client"

async function AnalyzeContent({ jobId }: { jobId?: string }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const savedJobs = await getSavedJobsForAnalysis()
  return <AnalyzeClient savedJobs={savedJobs} initialJobId={jobId} />
}

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: Promise<{ jobId?: string }>
}) {
  const { jobId } = await searchParams
  return (
    <Suspense fallback={<div className="animate-pulse h-96 m-8 bg-muted" />}>
      <AnalyzeContent jobId={jobId} />
    </Suspense>
  )
}
