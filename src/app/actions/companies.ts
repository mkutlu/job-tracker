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

export async function getCompanies() {
  const user = await getUser()
  return prisma.company.findMany({
    where: { userId: user.id },
    include: {
      _count: { select: { jobs: true, contacts: true } },
      jobs: {
        select: {
          id: true,
          title: true,
          status: true,
          location: true,
          locationType: true,
          appliedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { name: "asc" },
  })
}

export async function createCompany(formData: FormData) {
  const user = await getUser()
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { success: false, error: "Company name is required" }

  try {
    await prisma.company.create({
      data: {
        userId: user.id,
        name,
        website: (formData.get("website") as string) || null,
        industry: (formData.get("industry") as string) || null,
        size: (formData.get("size") as string) || null,
        notes: (formData.get("notes") as string) || null,
      },
    })
    revalidatePath("/companies")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to create company" }
  }
}

export async function updateCompany(id: string, formData: FormData) {
  const user = await getUser()
  const name = (formData.get("name") as string)?.trim()
  if (!name) return { success: false, error: "Company name is required" }

  try {
    await prisma.company.updateMany({
      where: { id, userId: user.id },
      data: {
        name,
        website: (formData.get("website") as string) || null,
        industry: (formData.get("industry") as string) || null,
        size: (formData.get("size") as string) || null,
        notes: (formData.get("notes") as string) || null,
      },
    })
    revalidatePath("/companies")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to update company" }
  }
}

export async function deleteCompany(id: string) {
  const user = await getUser()
  try {
    await prisma.company.deleteMany({ where: { id, userId: user.id } })
    revalidatePath("/companies")
    return { success: true }
  } catch {
    return { success: false, error: "Failed to delete company" }
  }
}
