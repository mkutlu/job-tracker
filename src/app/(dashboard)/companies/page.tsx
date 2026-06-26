import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getCompanies } from "@/app/actions/companies"
import { CompaniesClient } from "@/components/companies/companies-client"

async function CompaniesContent() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const companies = await getCompanies()
  return <CompaniesClient companies={companies} />
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 m-8 bg-muted" />}>
      <CompaniesContent />
    </Suspense>
  )
}
