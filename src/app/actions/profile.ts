"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { UserJobStatus } from "@prisma/client"

export async function saveProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const firstName = (formData.get("firstName") as string).trim()
  const lastName = (formData.get("lastName") as string).trim()
  const currentTitle = (formData.get("currentTitle") as string)?.trim() || null
  const jobStatus = formData.get("jobStatus") as UserJobStatus

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: { firstName, lastName, currentTitle, jobStatus },
    create: { userId: user.id, firstName, lastName, currentTitle, jobStatus },
  })

  redirect("/jobs")
}
