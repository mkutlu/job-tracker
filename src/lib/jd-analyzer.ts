export type SignalResult = {
  id: string
  label: string
  description: string
  points: number
  maxPoints: number
  triggered: boolean
  evidence: string | null
}

export type AnalysisResult = {
  score: number          // 0–100
  verdict: "likely_perm" | "suspicious" | "probably_legitimate"
  signals: SignalResult[]
}

// ── Helpers ────────────────────────────────────────────────────

function lower(text: string) {
  return text.toLowerCase()
}

function countMatches(text: string, patterns: RegExp[]): number {
  return patterns.filter((p) => p.test(text)).length
}

// ── Signal detectors ───────────────────────────────────────────

function detectAndChaining(text: string): SignalResult {
  // Matches 3+ tokens chained by uppercase " AND " — lowercase "and" is normal prose
  const matches = text.match(/\b[\w.#+]+\s+AND\s+[\w.#+]+(?:\s+AND\s+[\w.#+]+)+/g) ?? []
  const triggered = matches.length > 0
  const longest = matches.sort((a, b) => b.split(/\bAND\b/i).length - a.split(/\bAND\b/i).length)[0] ?? null

  return {
    id: "and_chaining",
    label: "AND-chained skill requirements",
    description: "Skills chained with AND (not OR) signal requirements written to match one specific person rather than a range of candidates.",
    points: triggered ? 25 : 0,
    maxPoints: 25,
    triggered,
    evidence: longest ? `e.g. "${longest.trim()}"` : null,
  }
}

function detectDegreeOverspecification(text: string): SignalResult {
  const t = lower(text)
  const patterns = [
    /no\s+(equivalent|related)\s+experience\s+(accepted|allowed|considered)/i,
    /in\s+lieu\s+of\s+(a\s+)?(degree|education)/i,
    /bachelor['']?s?\s+(of|in)\s+(science\s+in\s+)?computer\s+science\s+only/i,
    /degree\s+in\s+computer\s+science\s*(,\s*no\s+other)/i,
    /will\s+not\s+accept\s+(equivalent|related|substitute)/i,
    /must\s+be\s+in\s+(computer\s+science|information\s+(technology|systems))\s*\./i,
    /no\s+substitut/i,
  ]
  const matched = patterns.filter((p) => p.test(t))
  const triggered = matched.length > 0

  return {
    id: "degree_overspecification",
    label: "Degree hyper-specified / no equivalents accepted",
    description: "Refusing equivalent experience or specifying exact degree field beyond industry norms is an attorney technique to match only the sponsored worker's credentials.",
    points: triggered ? 20 : 0,
    maxPoints: 20,
    triggered,
    evidence: triggered ? "Found: \"" + (text.match(matched[0]) ?? [])[0] + "\"" : null,
  }
}

function detectVersionNumbers(text: string): SignalResult {
  // Look for specific software version patterns in requirements context
  const versionPattern = /\b(SAP\s+[\w/]+\s+\d[\d.]+|Oracle\s+\w*\s*\d+[a-z]?|WebLogic\s+[\d.]+|WebSphere\s+[\d.]+|JBoss\s+[\d.]+|Siebel\s+[\d.]+|PeopleSoft\s+[\d.]+|[\w]+\s+v?(\d+\.\d+(\.\d+)?))\b/gi
  const matches = [...new Set(text.match(versionPattern) ?? [])]
  const triggered = matches.length >= 2

  return {
    id: "version_numbers",
    label: "Specific software version numbers required",
    description: "Requiring exact software versions (e.g. 'SAP S/4HANA 1909', 'Oracle 12c') is unusual for genuine postings and typical of PERM requirements written to match a specific worker's experience.",
    points: triggered ? 15 : 0,
    maxPoints: 15,
    triggered,
    evidence: triggered ? `Found: ${matches.slice(0, 3).map((m) => `"${m.trim()}"`).join(", ")}` : null,
  }
}

function detectSkillsListDensity(text: string): SignalResult {
  // Count bullet points / list items in requirements section
  const bullets = text.match(/^[\s]*[-•*·]\s+.+$/gm) ?? []
  const requiredTerms = /\b(required|must have|must possess|mandatory|necessary)\b/gi
  const requiredCount = (text.match(requiredTerms) ?? []).length

  // High count of bullets with required language and no "preferred"/"nice to have"
  const hasPreferred = /\b(preferred|nice to have|plus|bonus|desired|advantage)\b/i.test(text)
  const triggered = bullets.length >= 12 && requiredCount >= 2 && !hasPreferred

  return {
    id: "skills_density",
    label: "12+ required skills, no preferred/nice-to-have tier",
    description: "Genuine postings distinguish required from preferred skills. A long list where everything is 'required' with no flexibility tier is characteristic of PERM filings.",
    points: triggered ? 15 : 0,
    maxPoints: 15,
    triggered,
    evidence: triggered ? `${bullets.length} bullet points, ${requiredCount} "required" mentions, no preferred tier` : null,
  }
}

const KNOWN_PERM_EMPLOYERS = [
  "tata consultancy", "tcs", "infosys", "wipro", "hcl technologies", "hcl tech",
  "cognizant", "tech mahindra", "mphasis", "hexaware", "niit technologies",
  "mastech", "igate", "patni", "syntel", "kforce", "mindtree",
  "larsen & toubro infotech", "lti", "persistent systems",
]

function detectKnownEmployer(text: string): SignalResult {
  const t = lower(text)
  const matched = KNOWN_PERM_EMPLOYERS.find((e) => t.includes(e)) ?? null

  return {
    id: "known_employer",
    label: "Known high-volume PERM filer",
    description: "IT consulting and outsourcing firms are among the top PERM labor certification filers in the US.",
    points: matched ? 15 : 0,
    maxPoints: 15,
    triggered: !!matched,
    evidence: matched ? `Employer matches: "${matched}"` : null,
  }
}

function detectLegalLanguage(text: string): SignalResult {
  const patterns = [
    /permanent\s+full[- ]time\s+(position|employment|job)/i,
    /various\s+unanticipated\s+(client\s+)?(sites?|locations?|worksite)/i,
    /position\s+(is\s+)?available\s+due\s+to\s+business\s+necessity/i,
    /employer\s+requires\s+(the\s+)?applicant/i,
    /this\s+position\s+requires?\s+a\s+(bachelor|master|phd|doctorate)/i,
    /labor\s+certification/i,
    /perm\s+/i,
    /prevailing\s+wage/i,
  ]
  const matched = patterns.filter((p) => p.test(text))
  const triggered = matched.length > 0

  return {
    id: "legal_language",
    label: "DOL / immigration legal language",
    description: "Phrases like 'permanent full-time position', 'various unanticipated worksites', or 'prevailing wage' are lifted directly from DOL PERM filing requirements.",
    points: triggered ? 12 : 0,
    maxPoints: 12,
    triggered,
    evidence: triggered ? `Found: "${(text.match(matched[0]) ?? [])[0]?.trim()}"` : null,
  }
}

const SOFT_SKILL_TERMS = [
  "communication", "collaboration", "teamwork", "interpersonal", "leadership",
  "problem.solving", "critical thinking", "adaptable", "self-starter", "motivated",
  "passionate", "curious", "mentor", "fast.paced",
]

const CULTURE_TERMS = [
  "our team", "we believe", "join us", "our mission", "our culture", "work with us",
  "you.ll work", "we.re looking", "about us", "who we are", "our values",
]

function detectAbsenceOfHumanLanguage(text: string): SignalResult {
  const t = lower(text)
  const hasSoftSkills = SOFT_SKILL_TERMS.some((term) => new RegExp(term, "i").test(t))
  const hasCulture = CULTURE_TERMS.some((term) => new RegExp(term, "i").test(t))
  const triggered = !hasSoftSkills && !hasCulture

  return {
    id: "no_human_language",
    label: "No soft skills or company culture language",
    description: "Genuine job postings almost always include team culture, soft skills, or 'who we are' language. Pure technical requirement lists with no human element are a common PERM pattern.",
    points: triggered ? 10 : 0,
    maxPoints: 10,
    triggered,
    evidence: triggered ? "No soft skills, team culture, or recruiter voice detected in the text" : null,
  }
}

const PERM_TITLES = [
  "programmer analyst",
  "systems analyst",
  "software developer/analyst",
  "software engineer/analyst",
  "it analyst",
  "associate technical analyst",
  "senior programmer analyst",
]

function detectPermEraTitle(text: string): SignalResult {
  const t = lower(text)
  // Check first 300 chars where title usually appears
  const titleSection = t.slice(0, 300)
  const matched = PERM_TITLES.find((title) => titleSection.includes(title)) ?? null

  return {
    id: "perm_title",
    label: "PERM-era job title",
    description: "Titles like 'Programmer Analyst' or 'Systems Analyst' are heavily overrepresented in PERM filings compared to the broader job market.",
    points: matched ? 8 : 0,
    maxPoints: 8,
    triggered: !!matched,
    evidence: matched ? `Title contains: "${matched}"` : null,
  }
}

// ── Main analyzer ──────────────────────────────────────────────

const MAX_RAW_SCORE = 120 // sum of all maxPoints

export function analyzeJD(text: string): AnalysisResult {
  if (!text?.trim()) {
    return {
      score: 0,
      verdict: "probably_legitimate",
      signals: [],
    }
  }

  const signals: SignalResult[] = [
    detectAndChaining(text),
    detectDegreeOverspecification(text),
    detectVersionNumbers(text),
    detectSkillsListDensity(text),
    detectKnownEmployer(text),
    detectLegalLanguage(text),
    detectAbsenceOfHumanLanguage(text),
    detectPermEraTitle(text),
  ]

  const rawScore = signals.reduce((sum, s) => sum + s.points, 0)
  const score = Math.min(100, Math.round((rawScore / MAX_RAW_SCORE) * 100))

  const verdict =
    score >= 65 ? "likely_perm"
    : score >= 35 ? "suspicious"
    : "probably_legitimate"

  return { score, verdict, signals }
}
