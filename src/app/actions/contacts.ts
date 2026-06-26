"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"

async function getUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) redirect("/login")
  return user
}

export async function getContacts() {
  const user = await getUser()
  return prisma.contact.findMany({
    where: { userId: user.id },
    include: {
      company: { select: { id: true, name: true } },
      job: { select: { id: true, title: true, status: true } },
    },
    orderBy: { name: "asc" },
  })
}

export async function createContact(formData: FormData) {
  const user = await getUser()
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { success: false, error: "Name is required" }

  const companyId = (formData.get("companyId") as string) || null
  const jobId = (formData.get("jobId") as string) || null

  try {
    await prisma.contact.create({
      data: {
        userId: user.id,
        name,
        title: (formData.get("title") as string) || null,
        email: (formData.get("email") as string) || null,
        linkedin: (formData.get("linkedin") as string) || null,
        companyId,
        jobId,
        notes: (formData.get("notes") as string) || null,
      },
    })
    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to create contact" }
  }
}

export async function updateContact(id: string, formData: FormData) {
  const user = await getUser()
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { success: false, error: "Name is required" }

  const companyId = (formData.get("companyId") as string) || null
  const jobId = (formData.get("jobId") as string) || null

  try {
    await prisma.contact.updateMany({
      where: { id, userId: user.id },
      data: {
        name,
        title: (formData.get("title") as string) || null,
        email: (formData.get("email") as string) || null,
        linkedin: (formData.get("linkedin") as string) || null,
        companyId,
        jobId,
        notes: (formData.get("notes") as string) || null,
      },
    })
    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update contact" }
  }
}

export async function deleteContact(id: string) {
  const user = await getUser()
  try {
    await prisma.contact.deleteMany({ where: { id, userId: user.id } })
    revalidatePath("/contacts")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete contact" }
  }
}

export async function getContactFormData() {
  const user = await getUser()
  const [companies, jobs] = await Promise.all([
    prisma.company.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.job.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, companyId: true, company: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ])
  return { companies, jobs }
}
