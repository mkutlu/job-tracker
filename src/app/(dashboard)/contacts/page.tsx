import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getContacts, getContactFormData } from "@/app/actions/contacts"
import { ContactsClient } from "@/components/contacts/contacts-client"

async function ContactsContent() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [contacts, { companies, jobs }] = await Promise.all([
    getContacts(),
    getContactFormData(),
  ])

  return <ContactsClient contacts={contacts} companies={companies} jobs={jobs} />
}

export default function ContactsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96 m-8 bg-muted" />}>
      <ContactsContent />
    </Suspense>
  )
}
