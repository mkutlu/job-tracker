"use server"

import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { JobStatus, Priority, JobSource, LocationType } from "@prisma/client"

export async function searchCompanies(query: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const companies = await prisma.company.findMany({
    where: {
      userId: user.id,
      name: { contains: query, mode: "insensitive" },
    },
    select: { id: true, name: true },
    take: 8,
  })

  return companies
}

export async function createJob(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    const title = (formData.get("title") as string).trim()
    const companyName = (formData.get("companyName") as string).trim()
    const status = (formData.get("status") as JobStatus) || "BOOKMARKED"
    const priority = (formData.get("priority") as Priority) || "MEDIUM"
    const excitementRaw = parseInt(formData.get("excitement") as string)
    const excitement = excitementRaw >= 1 && excitementRaw <= 5 ? excitementRaw : null
    const location = (formData.get("location") as string)?.trim() || null
    const locationType = (formData.get("locationType") as LocationType) || null
    const salaryMin = parseInt(formData.get("salaryMin") as string) || null
    const salaryMax = parseInt(formData.get("salaryMax") as string) || null
    const salaryCurrency = (formData.get("salaryCurrency") as string) || null
    const jobUrl = (formData.get("jobUrl") as string)?.trim() || null
    const source = (formData.get("source") as JobSource) || null
    const recruiterName = (formData.get("recruiterName") as string)?.trim() || null
    const nextStepAt = formData.get("nextStepAt") ? new Date(formData.get("nextStepAt") as string) : null
    const offerAmount = parseInt(formData.get("offerAmount") as string) || null
    const offerDeadline = formData.get("offerDeadline") ? new Date(formData.get("offerDeadline") as string) : null
    const appliedAt = formData.get("appliedAt") ? new Date(formData.get("appliedAt") as string) : null
    const deadlineAt = formData.get("deadlineAt") ? new Date(formData.get("deadlineAt") as string) : null
    const notes = (formData.get("notes") as string)?.trim() || null
    const jobDescription = (formData.get("jobDescription") as string)?.trim() || null

    const job = await prisma.$transaction(async (tx) => {
      const existingCompany = await tx.company.findFirst({
        where: { userId: user.id, name: { equals: companyName, mode: "insensitive" } },
        select: { id: true },
      })

      const companyId = existingCompany
        ? existingCompany.id
        : (await tx.company.create({ data: { userId: user.id, name: companyName } })).id

      return tx.job.create({
        data: {
          userId: user.id,
          title,
          companyId,
          status,
          priority,
          excitement,
          location,
          locationType,
          salaryMin,
          salaryMax,
          salaryCurrency,
          jobUrl,
          source,
          recruiterName,
          nextStepAt,
          offerAmount,
          offerDeadline,
          appliedAt,
          deadlineAt,
          notes,
          jobDescription,
        },
        select: { id: true },
      })
    })

    return { success: true, jobId: job.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create job"
    return { success: false, error: message }
  }
}

export async function updateJob(id: string, formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    const existing = await prisma.job.findUnique({ where: { id }, select: { userId: true } })
    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Job not found" }
    }

    const title = (formData.get("title") as string).trim()
    const companyName = (formData.get("companyName") as string).trim()
    const status = (formData.get("status") as JobStatus) || "BOOKMARKED"
    const priority = (formData.get("priority") as Priority) || "MEDIUM"
    const excitementRaw = parseInt(formData.get("excitement") as string)
    const excitement = excitementRaw >= 1 && excitementRaw <= 5 ? excitementRaw : null
    const location = (formData.get("location") as string)?.trim() || null
    const locationType = (formData.get("locationType") as LocationType) || null
    const salaryMin = parseInt(formData.get("salaryMin") as string) || null
    const salaryMax = parseInt(formData.get("salaryMax") as string) || null
    const salaryCurrency = (formData.get("salaryCurrency") as string) || null
    const jobUrl = (formData.get("jobUrl") as string)?.trim() || null
    const source = (formData.get("source") as JobSource) || null
    const recruiterName = (formData.get("recruiterName") as string)?.trim() || null
    const nextStepAt = formData.get("nextStepAt") ? new Date(formData.get("nextStepAt") as string) : null
    const offerAmount = parseInt(formData.get("offerAmount") as string) || null
    const offerDeadline = formData.get("offerDeadline") ? new Date(formData.get("offerDeadline") as string) : null
    const appliedAt = formData.get("appliedAt") ? new Date(formData.get("appliedAt") as string) : null
    const deadlineAt = formData.get("deadlineAt") ? new Date(formData.get("deadlineAt") as string) : null
    const notes = (formData.get("notes") as string)?.trim() || null
    const jobDescription = (formData.get("jobDescription") as string)?.trim() || null

    await prisma.$transaction(async (tx) => {
      const existingCompany = await tx.company.findFirst({
        where: { userId: user.id, name: { equals: companyName, mode: "insensitive" } },
        select: { id: true },
      })

      const companyId = existingCompany
        ? existingCompany.id
        : (await tx.company.create({ data: { userId: user.id, name: companyName } })).id

      await tx.job.update({
        where: { id },
        data: {
          title,
          companyId,
          status,
          priority,
          excitement,
          location,
          locationType,
          salaryMin,
          salaryMax,
          salaryCurrency,
          jobUrl,
          source,
          recruiterName,
          nextStepAt,
          offerAmount,
          offerDeadline,
          appliedAt,
          deadlineAt,
          notes,
          jobDescription,
        },
      })
    })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update job"
    return { success: false, error: message }
  }
}

export async function deleteJob(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  try {
    const existing = await prisma.job.findUnique({ where: { id }, select: { userId: true } })
    if (!existing || existing.userId !== user.id) {
      return { success: false, error: "Job not found" }
    }

    await prisma.job.delete({ where: { id } })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete job"
    return { success: false, error: message }
  }
}

export async function getJobs(filters?: {
  status?: JobStatus
  priority?: Priority
  source?: JobSource
  search?: string
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const jobs = await prisma.job.findMany({
    where: {
      userId: user.id,
      ...(filters?.status && { status: filters.status }),
      ...(filters?.priority && { priority: filters.priority }),
      ...(filters?.source && { source: filters.source }),
      ...(filters?.search && {
        OR: [
          { title: { contains: filters.search, mode: "insensitive" } },
          { company: { name: { contains: filters.search, mode: "insensitive" } } },
        ],
      }),
    },
    include: { company: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  return jobs
}

export async function getJob(id: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const job = await prisma.job.findUnique({
    where: { id },
    include: { company: { select: { name: true } } },
  })

  if (!job || job.userId !== user.id) return null

  return job
}
