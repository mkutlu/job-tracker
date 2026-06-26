import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getSavedJobsForAnalysis } from "@/app/actions/analyze"
import { AnalyzeClient } from "@/components/analyze/analyze-client"

async function AnalyzeContent() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const savedJobs = await getSavedJobsForAnalysis()
  return <AnalyzeClient savedJobs={savedJobs} />
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 m-8 bg-muted" />}>
      <AnalyzeContent />
    </Suspense>
  )
}
