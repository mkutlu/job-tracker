"use server"

import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { analyzeJD } from "@/lib/jd-analyzer"
import { analyzeJDWithClaude } from "@/lib/jd-analyzer-claude"

export async function getSavedJobsForAnalysis() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  return prisma.job.findMany({
    where: { userId: user.id, jobDescription: { not: null } },
    select: {
      id: true,
      title: true,
      jobDescription: true,
      company: { select: { name: true } },
      jdAnalysis: {
        select: {
          permScore: true,
          permVerdict: true,
          permData: true,
          permAnalyzedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getRecentPermAnalyses() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // Include orphaned analyses (jobId = null after job deletion) by querying JDAnalysis directly
  const analyses = await prisma.jDAnalysis.findMany({
    where: {
      permScore: { not: null },
      job: { userId: user.id },
    },
    select: {
      jobId: true,
      permScore: true,
      permVerdict: true,
      permAnalyzedAt: true,
      job: {
        select: {
          id: true,
          title: true,
          company: { select: { name: true } },
        },
      },
    },
    orderBy: { permAnalyzedAt: "desc" },
    take: 10,
  })

  return analyses
}

export async function deletePermAnalysis(jobId: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // IDOR check: verify the analysis belongs to this user via job ownership
  const job = await prisma.job.findFirst({ where: { id: jobId, userId: user.id } })
  if (!job) return { success: false as const, error: "Not found" }

  await prisma.jDAnalysis.update({
    where: { jobId },
    data: {
      permScore: null,
      permVerdict: null,
      permData: Prisma.JsonNull,
      permAnalyzedAt: null,
    },
  })

  return { success: true as const }
}

export async function runAnalysis(text: string, jobId?: string) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const trimmed = text?.trim()
  if (!trimmed || trimmed.length < 50) {
    return { success: false as const, error: "Please provide a job description (at least 50 characters)." }
  }

  const result = analyzeJD(trimmed)
  const triggeredSignals = result.signals.filter((s) => s.triggered)
  const claudeAnalysis = await analyzeJDWithClaude(trimmed, triggeredSignals)

  const combinedScore = claudeAnalysis
    ? Math.round(result.score * 0.6 + claudeAnalysis.claudeScore * 0.4)
    : result.score

  const combinedVerdict =
    combinedScore >= 65 ? "likely_perm" as const
    : combinedScore >= 35 ? "suspicious" as const
    : "probably_legitimate" as const

  // Persist to DB if this analysis came from a saved job (IDOR check: verify ownership)
  if (jobId) {
    const job = await prisma.job.findFirst({ where: { id: jobId, userId: user.id } })
    if (job) {
      await prisma.jDAnalysis.upsert({
        where: { jobId },
        create: {
          jobId,
          permScore: combinedScore,
          permVerdict: combinedVerdict,
          permData: { result, claudeAnalysis } as object,
          permAnalyzedAt: new Date(),
        },
        update: {
          permScore: combinedScore,
          permVerdict: combinedVerdict,
          permData: { result, claudeAnalysis } as object,
          permAnalyzedAt: new Date(),
        },
      })
    }
  }

  return { success: true as const, result, claudeAnalysis, combinedScore, combinedVerdict }
}
