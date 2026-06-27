import { analyzeJDWithClaude, SEMANTIC_SIGNAL_LABELS } from "../jd-analyzer-claude"
import type { SignalResult } from "../jd-analyzer"

// ── Module mocks ───────────────────────────────────────────────

const mockCreate = jest.fn()

jest.mock("@anthropic-ai/sdk", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: (...args: unknown[]) => mockCreate(...args) },
    })),
  }
})

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

// Simulate the model's continuation after the "{" prefill
const CLAUDE_CONTINUATION = JSON.stringify({
  semanticSignals: [
    { id: "vague_location", triggered: true, evidence: "Work location: various client sites" },
    { id: "salary_precision", triggered: false, evidence: null },
    { id: "no_company_personality", triggered: true, evidence: null },
    { id: "passive_impersonal_tone", triggered: true, evidence: "Applicant must possess" },
    { id: "artificially_narrow", triggered: false, evidence: null },
  ],
  claudeVerdict: "likely_perm",
  claudeScore: 80,
  reasoning: "Multiple PERM indicators present. AND-chaining and vague location strongly suggest a dummy posting.",
}).slice(1) // strip the leading "{" since we pre-filled it

function mockSuccess() {
  mockCreate.mockResolvedValue({
    content: [{ type: "text", text: CLAUDE_CONTINUATION }],
  })
}

// ── Tests ──────────────────────────────────────────────────────

describe("analyzeJDWithClaude", () => {
  beforeEach(() => {
    mockCreate.mockReset()
    process.env.ANTHROPIC_API_KEY = "sk-ant-test-key"
  })

  afterEach(() => {
    delete process.env.ANTHROPIC_API_KEY
  })

  it("returns null when ANTHROPIC_API_KEY is not set", async () => {
    delete process.env.ANTHROPIC_API_KEY
    const result = await analyzeJDWithClaude("some JD text", [])
    expect(result).toBeNull()
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it("returns Claude analysis on success", async () => {
    mockSuccess()
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
    mockCreate.mockRejectedValue(new Error("API rate limit"))
    const result = await analyzeJDWithClaude("some JD text", TRIGGERED_SIGNALS)
    expect(result).toBeNull()
  })

  it("returns null when response continuation is not valid JSON", async () => {
    mockCreate.mockResolvedValue({
      content: [{ type: "text", text: "not valid json at all" }],
    })
    const result = await analyzeJDWithClaude("some JD text", [])
    expect(result).toBeNull()
  })

  it("passes triggered signals summary to the prompt", async () => {
    mockSuccess()
    await analyzeJDWithClaude("some JD text", TRIGGERED_SIGNALS)

    const call = mockCreate.mock.calls[0][0]
    expect(call.messages[0].content).toContain("AND-chained skill requirements")
  })

  it("truncates JD text to 3000 chars in prompt", async () => {
    mockSuccess()
    const longJD = "x".repeat(5000)
    await analyzeJDWithClaude(longJD, [])

    const call = mockCreate.mock.calls[0][0]
    // prompt should not contain the full 5000 chars
    expect(call.messages[0].content.length).toBeLessThan(5000 + 1000)
  })

  it("shows 'None' in prompt when no signals triggered", async () => {
    mockSuccess()
    await analyzeJDWithClaude("some JD text", [])

    const call = mockCreate.mock.calls[0][0]
    expect(call.messages[0].content).toContain("None")
  })

  it("returns null on network error", async () => {
    mockCreate.mockRejectedValue(new Error("ECONNRESET"))
    const result = await analyzeJDWithClaude("some JD text", [])
    expect(result).toBeNull()
  })

  it("includes all 5 semantic signal IDs in response", async () => {
    mockSuccess()
    const result = await analyzeJDWithClaude("JD text", [])
    const ids = result?.semanticSignals.map((s) => s.id) ?? []
    expect(ids).toContain("vague_location")
    expect(ids).toContain("salary_precision")
    expect(ids).toContain("no_company_personality")
    expect(ids).toContain("passive_impersonal_tone")
    expect(ids).toContain("artificially_narrow")
  })
})

// ── SEMANTIC_SIGNAL_LABELS ─────────────────────────────────────

describe("SEMANTIC_SIGNAL_LABELS", () => {
  it("has label and description for all 5 signal IDs", () => {
    const ids = [
      "vague_location",
      "salary_precision",
      "no_company_personality",
      "passive_impersonal_tone",
      "artificially_narrow",
    ] as const

    for (const id of ids) {
      expect(SEMANTIC_SIGNAL_LABELS[id].label).toBeTruthy()
      expect(SEMANTIC_SIGNAL_LABELS[id].description).toBeTruthy()
    }
  })
})
