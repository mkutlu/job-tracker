import { analyzeJDWithClaude, SEMANTIC_SIGNAL_LABELS } from "../jd-analyzer-claude"
import type { SignalResult } from "../jd-analyzer"

// ── Module mocks ───────────────────────────────────────────────

const mockGenerateObject = jest.fn()

jest.mock("ai", () => ({
  generateObject: (...args: unknown[]) => mockGenerateObject(...args),
}))

jest.mock("@ai-sdk/anthropic", () => ({
  anthropic: jest.fn(() => "mock-model"),
}))

// ── Helpers ────────────────────────────────────────────────────

const TRIGGERED_SIGNALS: SignalResult[] = [
  {
    id: "and_chaining",
    label: "AND-chained skill requirements",
    description: "",
    points: 25,
    maxPoints: 25,
    triggered: true,
    evidence: 'e.g. "Java AND Spring AND Oracle"',
  },
]

const CLAUDE_RESPONSE = {
  semanticSignals: [
    { id: "vague_location" as const, triggered: true, evidence: "Work location: various client sites" },
    { id: "salary_precision" as const, triggered: false, evidence: null },
    { id: "no_company_personality" as const, triggered: true, evidence: null },
    { id: "passive_impersonal_tone" as const, triggered: true, evidence: "Applicant must possess" },
    { id: "artificially_narrow" as const, triggered: false, evidence: null },
  ],
  claudeVerdict: "likely_perm" as const,
  claudeScore: 80,
  reasoning: "Multiple PERM indicators present. AND-chaining and vague location strongly suggest a dummy posting.",
}

// ── Tests ──────────────────────────────────────────────────────

describe("analyzeJDWithClaude", () => {
  beforeEach(() => {
    mockGenerateObject.mockReset()
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key"
    jest.resetModules()
  })

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  it("returns null when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY
    const result = await analyzeJDWithClaude("some JD text", [])
    expect(result).toBeNull()
    expect(mockGenerateObject).not.toHaveBeenCalled()
  })

  it("returns Claude analysis on success", async () => {
    mockGenerateObject.mockResolvedValue({ object: CLAUDE_RESPONSE })

    const result = await analyzeJDWithClaude(
      "Programmer Analyst — Tata Consultancy Services",
      TRIGGERED_SIGNALS,
    )

    expect(result).not.toBeNull()
    expect(result?.claudeVerdict).toBe("likely_perm")
    expect(result?.claudeScore).toBe(80)
    expect(result?.reasoning).toContain("PERM indicators")
    expect(result?.semanticSignals).toHaveLength(5)
  })

  it("returns null when API call throws", async () => {
    mockGenerateObject.mockRejectedValue(new Error("API rate limit"))

    const result = await analyzeJDWithClaude("some JD text", TRIGGERED_SIGNALS)
    expect(result).toBeNull()
  })

  it("passes triggered signals summary to the prompt", async () => {
    mockGenerateObject.mockResolvedValue({ object: CLAUDE_RESPONSE })

    await analyzeJDWithClaude("some JD text", TRIGGERED_SIGNALS)

    const call = mockGenerateObject.mock.calls[0][0]
    expect(call.prompt).toContain("AND-chained skill requirements")
  })

  it("passes JD text (up to 3000 chars) to the prompt", async () => {
    mockGenerateObject.mockResolvedValue({ object: CLAUDE_RESPONSE })

    const longJD = "x".repeat(5000)
    await analyzeJDWithClaude(longJD, [])

    const call = mockGenerateObject.mock.calls[0][0]
    expect(call.prompt).toContain("x".repeat(100))
    // Should not include chars beyond 3000
    expect(call.prompt.length).toBeLessThan(longJD.length + 1000)
  })

  it("returns null on network timeout (generic error)", async () => {
    mockGenerateObject.mockRejectedValue(new Error("ECONNRESET"))

    const result = await analyzeJDWithClaude("some JD text", [])
    expect(result).toBeNull()
  })

  it("includes all 5 semantic signals in response", async () => {
    mockGenerateObject.mockResolvedValue({ object: CLAUDE_RESPONSE })

    const result = await analyzeJDWithClaude("JD text", [])
    const ids = result?.semanticSignals.map((s) => s.id) ?? []
    expect(ids).toContain("vague_location")
    expect(ids).toContain("salary_precision")
    expect(ids).toContain("no_company_personality")
    expect(ids).toContain("passive_impersonal_tone")
    expect(ids).toContain("artificially_narrow")
  })

  it("passes empty signal summary when no signals triggered", async () => {
    mockGenerateObject.mockResolvedValue({ object: CLAUDE_RESPONSE })

    await analyzeJDWithClaude("some JD text", [])

    const call = mockGenerateObject.mock.calls[0][0]
    expect(call.prompt).toContain("None")
  })
})

// ── SEMANTIC_SIGNAL_LABELS ─────────────────────────────────────

describe("SEMANTIC_SIGNAL_LABELS", () => {
  it("has entries for all 5 signal IDs", () => {
    const ids = ["vague_location", "salary_precision", "no_company_personality", "passive_impersonal_tone", "artificially_narrow"]
    for (const id of ids) {
      expect(SEMANTIC_SIGNAL_LABELS).toHaveProperty(id)
      expect(SEMANTIC_SIGNAL_LABELS[id as keyof typeof SEMANTIC_SIGNAL_LABELS].label).toBeTruthy()
      expect(SEMANTIC_SIGNAL_LABELS[id as keyof typeof SEMANTIC_SIGNAL_LABELS].description).toBeTruthy()
    }
  })
})
