import Anthropic from "@anthropic-ai/sdk"
import { z } from "zod"
import type { SignalResult } from "./jd-analyzer"

// ── Schema ─────────────────────────────────────────────────────

const SemanticSignalSchema = z.object({
  id: z.enum([
    "vague_location",
    "salary_precision",
    "no_company_personality",
    "passive_impersonal_tone",
    "artificially_narrow",
  ]),
  triggered: z.boolean(),
  evidence: z.string().nullable(),
})

const ClaudeAnalysisSchema = z.object({
  semanticSignals: z.array(SemanticSignalSchema),
  claudeVerdict: z.enum(["likely_perm", "suspicious", "probably_legitimate"]),
  claudeScore: z.number().min(0).max(100),
  reasoning: z.string(),
})

export type SemanticSignal = z.infer<typeof SemanticSignalSchema>
export type ClaudeAnalysis = z.infer<typeof ClaudeAnalysisSchema>

// ── Labels ─────────────────────────────────────────────────────

export const SEMANTIC_SIGNAL_LABELS: Record<SemanticSignal["id"], { label: string; description: string }> = {
  vague_location: {
    label: "Vague work location",
    description: "Location listed as 'client sites' or similar without a city/state, a PERM-filing pattern.",
  },
  salary_precision: {
    label: "DOL-style salary precision",
    description: "Salary cited as a single exact number (not a range), consistent with a prevailing wage determination.",
  },
  no_company_personality: {
    label: "No employer branding",
    description: "No mission, culture, benefits, or 'why work here' language — reads like a form, not a pitch.",
  },
  passive_impersonal_tone: {
    label: "Passive / impersonal tone",
    description: "'Applicant must', 'candidate shall' — passive legal-draft language instead of conversational recruiting.",
  },
  artificially_narrow: {
    label: "Artificially narrow requirements",
    description: "Exact years (e.g., '7 years', not '5+') or hyper-specific field combinations designed to exclude all but one person.",
  },
}

// ── Prompt ─────────────────────────────────────────────────────

function buildPrompt(jdText: string, triggeredSignals: SignalResult[]): string {
  const triggeredSummary =
    triggeredSignals.length > 0
      ? triggeredSignals.map((s) => `- ${s.label}: ${s.evidence ?? "triggered"}`).join("\n")
      : "None"

  return [
    "You are a PERM labor certification expert. PERM is a US DOL process companies use to sponsor foreign workers for Green Cards.",
    "Companies sometimes post dummy job descriptions designed to match one specific foreign worker — written so narrowly that no US worker qualifies.",
    "",
    "A rule-based engine already scanned this JD. Add semantic/tonal signals that regex cannot catch.",
    "",
    "RULE ENGINE FINDINGS:",
    triggeredSummary,
    "",
    "JOB DESCRIPTION:",
    "---",
    jdText.slice(0, 3000),
    "---",
    "",
    "Complete the JSON by evaluating these five signals.",
    "Set triggered to true/false and evidence to a short quoted phrase or null.",
    "",
    "Signal definitions:",
    "1. vague_location — no specific city/state; just 'client sites' or 'various unanticipated locations'",
    "2. salary_precision — single exact dollar amount with no range (DOL prevailing wage pattern)",
    "3. no_company_personality — no mission, culture, benefits, or reason to apply; pure requirements list",
    "4. passive_impersonal_tone — 'applicant must', 'candidate shall' throughout; no inviting voice",
    "5. artificially_narrow — exact years (not '5+') or hyper-specific tech combinations to exclude most candidates",
    "",
    "Scoring guide: 0-34 = probably_legitimate, 35-64 = suspicious, 65-100 = likely_perm.",
    "Factor rule engine findings into your score. Keep reasoning to 2 sentences.",
  ].join("\n")
}

// ── API call ────────────────────────────────────────────────────

export async function analyzeJDWithClaude(
  jdText: string,
  triggeredSignals: SignalResult[],
): Promise<ClaudeAnalysis | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      // Assistant prefill forces JSON output — the model cannot un-say the opening brace
      messages: [
        { role: "user", content: buildPrompt(jdText, triggeredSignals) },
        { role: "assistant", content: "{" },
      ],
    })

    const raw = message.content[0].type === "text" ? message.content[0].text : ""
    const parsed = JSON.parse("{" + raw)
    return ClaudeAnalysisSchema.parse(parsed)
  } catch (err) {
    console.error("[jd-analyzer-claude] failed:", err instanceof Error ? err.message : err)
    return null
  }
}
