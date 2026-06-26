import { analyzeJD } from "../jd-analyzer"

// ── Helpers ────────────────────────────────────────────────────

function signal(result: ReturnType<typeof analyzeJD>, id: string) {
  return result.signals.find((s) => s.id === id)!
}

// ── AND-chaining ───────────────────────────────────────────────

describe("detectAndChaining", () => {
  it("triggers on 3+ skills chained with AND", () => {
    const jd = "Requirements: Java AND Spring AND Oracle AND UNIX experience required."
    const r = analyzeJD(jd)
    expect(signal(r, "and_chaining").triggered).toBe(true)
    expect(signal(r, "and_chaining").points).toBe(25)
  })

  it("does not trigger on normal 'and' usage", () => {
    const jd = "You will design and build and deploy microservices using modern tools."
    const r = analyzeJD(jd)
    expect(signal(r, "and_chaining").triggered).toBe(false)
  })

  it("does not trigger on two-item AND (only 2 chained)", () => {
    const jd = "Experience with React AND TypeScript preferred."
    const r = analyzeJD(jd)
    expect(signal(r, "and_chaining").triggered).toBe(false)
  })

  it("includes evidence of the longest chain", () => {
    const jd = "Must have Java AND Spring AND Oracle AND WebLogic AND UNIX."
    const r = analyzeJD(jd)
    expect(signal(r, "and_chaining").evidence).toContain("Java")
  })
})

// ── Degree overspecification ───────────────────────────────────

describe("detectDegreeOverspecification", () => {
  it("triggers on 'no equivalent experience accepted'", () => {
    const jd = "Bachelor's degree required. No equivalent experience accepted."
    const r = analyzeJD(jd)
    expect(signal(r, "degree_overspecification").triggered).toBe(true)
    expect(signal(r, "degree_overspecification").points).toBe(20)
  })

  it("triggers on 'in lieu of degree'", () => {
    const jd = "BS in CS required. We will not accept experience in lieu of a degree."
    const r = analyzeJD(jd)
    expect(signal(r, "degree_overspecification").triggered).toBe(true)
  })

  it("triggers on 'will not accept equivalent'", () => {
    const jd = "MS required. Will not accept equivalent or related experience."
    const r = analyzeJD(jd)
    expect(signal(r, "degree_overspecification").triggered).toBe(true)
  })

  it("does not trigger on normal degree requirement", () => {
    const jd = "Bachelor's degree in Computer Science or related field required."
    const r = analyzeJD(jd)
    expect(signal(r, "degree_overspecification").triggered).toBe(false)
  })
})

// ── Version numbers ────────────────────────────────────────────

describe("detectVersionNumbers", () => {
  it("triggers on 2+ specific software versions", () => {
    const jd = "Experience with SAP S/4HANA 1909 and Oracle 12c required."
    const r = analyzeJD(jd)
    expect(signal(r, "version_numbers").triggered).toBe(true)
    expect(signal(r, "version_numbers").points).toBe(15)
  })

  it("triggers on WebLogic and WebSphere versions", () => {
    const jd = "Must have WebLogic 12.2.1 and WebSphere 9.0 deployment experience."
    const r = analyzeJD(jd)
    expect(signal(r, "version_numbers").triggered).toBe(true)
  })

  it("does not trigger on single version mention", () => {
    const jd = "Experience with Python 3 and modern web frameworks."
    const r = analyzeJD(jd)
    expect(signal(r, "version_numbers").triggered).toBe(false)
  })

  it("does not trigger on general version mentions without product context", () => {
    const jd = "5+ years of experience. At least 2 years in a senior role."
    const r = analyzeJD(jd)
    expect(signal(r, "version_numbers").triggered).toBe(false)
  })
})

// ── Skills list density ────────────────────────────────────────

describe("detectSkillsListDensity", () => {
  const denseJD = `
Job Requirements (all required):
- Java programming
- Spring Framework
- Oracle Database
- SQL
- Linux/Unix
- WebLogic
- REST APIs
- Microservices
- Maven/Gradle
- Git
- Jenkins
- Docker
Must have all skills listed above.
  `.trim()

  it("triggers on 12+ bullets, required language, no preferred tier", () => {
    const r = analyzeJD(denseJD)
    expect(signal(r, "skills_density").triggered).toBe(true)
    expect(signal(r, "skills_density").points).toBe(15)
  })

  it("does not trigger when preferred/nice-to-have tier exists", () => {
    const jd = denseJD + "\nNice to have: Kubernetes experience preferred."
    const r = analyzeJD(jd)
    expect(signal(r, "skills_density").triggered).toBe(false)
  })

  it("does not trigger on short requirements list", () => {
    const jd = "Requirements:\n- React\n- TypeScript\n- Node.js\nMust have all three."
    const r = analyzeJD(jd)
    expect(signal(r, "skills_density").triggered).toBe(false)
  })
})

// ── Known employer ─────────────────────────────────────────────

describe("detectKnownEmployer", () => {
  it("triggers on Tata Consultancy Services", () => {
    const jd = "Company: Tata Consultancy Services (TCS). We are hiring..."
    const r = analyzeJD(jd)
    expect(signal(r, "known_employer").triggered).toBe(true)
    expect(signal(r, "known_employer").points).toBe(15)
  })

  it("triggers on Cognizant", () => {
    const jd = "Posted by Cognizant Technology Solutions."
    const r = analyzeJD(jd)
    expect(signal(r, "known_employer").triggered).toBe(true)
  })

  it("triggers on Infosys", () => {
    const jd = "Infosys is looking for a Java Developer."
    const r = analyzeJD(jd)
    expect(signal(r, "known_employer").triggered).toBe(true)
  })

  it("does not trigger on unknown companies", () => {
    const jd = "Acme Corp is hiring a software engineer."
    const r = analyzeJD(jd)
    expect(signal(r, "known_employer").triggered).toBe(false)
  })

  it("is case-insensitive", () => {
    const jd = "WIPRO TECHNOLOGIES is seeking candidates."
    const r = analyzeJD(jd)
    expect(signal(r, "known_employer").triggered).toBe(true)
  })
})

// ── Legal language ─────────────────────────────────────────────

describe("detectLegalLanguage", () => {
  it("triggers on 'permanent full-time position'", () => {
    const jd = "This is a permanent full-time position based in New Jersey."
    const r = analyzeJD(jd)
    expect(signal(r, "legal_language").triggered).toBe(true)
    expect(signal(r, "legal_language").points).toBe(12)
  })

  it("triggers on 'various unanticipated worksites'", () => {
    const jd = "Work location: various unanticipated client sites across the US."
    const r = analyzeJD(jd)
    expect(signal(r, "legal_language").triggered).toBe(true)
  })

  it("triggers on 'prevailing wage'", () => {
    const jd = "Salary: $95,000/year per prevailing wage determination."
    const r = analyzeJD(jd)
    expect(signal(r, "legal_language").triggered).toBe(true)
  })

  it("does not trigger on normal job description language", () => {
    const jd = "We are a fast-growing startup looking for a talented engineer to join our team."
    const r = analyzeJD(jd)
    expect(signal(r, "legal_language").triggered).toBe(false)
  })
})

// ── Absence of human language ──────────────────────────────────

describe("detectAbsenceOfHumanLanguage", () => {
  it("triggers when no soft skills or culture language present", () => {
    const jd = "Requirements: Java, Spring, Oracle, SQL. Must have 5 years. BS required."
    const r = analyzeJD(jd)
    expect(signal(r, "no_human_language").triggered).toBe(true)
    expect(signal(r, "no_human_language").points).toBe(10)
  })

  it("does not trigger when culture language is present", () => {
    const jd = "Join our team! We believe in collaboration and growth. Requirements: Java, Spring."
    const r = analyzeJD(jd)
    expect(signal(r, "no_human_language").triggered).toBe(false)
  })

  it("does not trigger when soft skills are mentioned", () => {
    const jd = "Strong communication and teamwork skills required. Java experience needed."
    const r = analyzeJD(jd)
    expect(signal(r, "no_human_language").triggered).toBe(false)
  })
})

// ── PERM-era title ─────────────────────────────────────────────

describe("detectPermEraTitle", () => {
  it("triggers on 'Programmer Analyst'", () => {
    const jd = "Programmer Analyst\nLocation: NJ\nRequirements:"
    const r = analyzeJD(jd)
    expect(signal(r, "perm_title").triggered).toBe(true)
    expect(signal(r, "perm_title").points).toBe(8)
  })

  it("triggers on 'Systems Analyst'", () => {
    const jd = "Systems Analyst – Full Time\nNew Jersey"
    const r = analyzeJD(jd)
    expect(signal(r, "perm_title").triggered).toBe(true)
  })

  it("does not trigger on modern titles", () => {
    const jd = "Senior Software Engineer\nWe're looking for a talented engineer."
    const r = analyzeJD(jd)
    expect(signal(r, "perm_title").triggered).toBe(false)
  })

  it("only checks the title area (first 300 chars)", () => {
    const jd = "Senior Software Engineer\n" + "x".repeat(300) + "\nProgrammer Analyst mentioned here"
    const r = analyzeJD(jd)
    expect(signal(r, "perm_title").triggered).toBe(false)
  })
})

// ── Scoring & verdict ──────────────────────────────────────────

describe("analyzeJD — scoring and verdict", () => {
  it("returns score 0 and probably_legitimate for empty input", () => {
    const r = analyzeJD("")
    expect(r.score).toBe(0)
    expect(r.verdict).toBe("probably_legitimate")
  })

  it("returns probably_legitimate for a genuine-looking posting", () => {
    const jd = `
      Senior Software Engineer — Acme Corp
      Join our collaborative team! We believe in mentorship and growth.
      You'll work with talented engineers on exciting products.
      Requirements (required):
      - 4+ years of React or Vue
      - TypeScript proficiency
      Nice to have: GraphQL, AWS experience preferred.
      Strong communication skills a must.
    `
    const r = analyzeJD(jd)
    expect(r.verdict).toBe("probably_legitimate")
    expect(r.score).toBeLessThan(35)
  })

  it("returns likely_perm for a clear PERM posting", () => {
    const jd = `
      Programmer Analyst
      Tata Consultancy Services
      This is a permanent full-time position. Work location: various unanticipated client sites.
      Requirements (all required, no equivalent experience accepted):
      - Java AND Spring AND Oracle AND WebLogic AND UNIX
      - SAP S/4HANA 1909
      - WebLogic 12.2.1
      - Oracle 12c database
      - SQL
      - Linux
      - Shell scripting
      - Maven
      - Jenkins
      - REST APIs
      - Microservices
      - Git
      Bachelor's in Computer Science. Will not accept equivalent experience.
    `
    const r = analyzeJD(jd)
    expect(r.verdict).toBe("likely_perm")
    expect(r.score).toBeGreaterThanOrEqual(65)
  })

  it("score never exceeds 100", () => {
    const jd = `
      Programmer Analyst — Infosys
      Permanent full-time. Various unanticipated worksites. Prevailing wage.
      Java AND Spring AND Oracle AND WebLogic AND UNIX AND SAP required.
      SAP S/4HANA 1909. WebLogic 12.2.1. Oracle 12c.
      No equivalent experience accepted. In lieu of degree not accepted.
      - skill1\n- skill2\n- skill3\n- skill4\n- skill5\n- skill6
      - skill7\n- skill8\n- skill9\n- skill10\n- skill11\n- skill12
      Must have all. Required. Mandatory.
    `
    const r = analyzeJD(jd)
    expect(r.score).toBeLessThanOrEqual(100)
  })

  it("returns suspicious for a partial-match posting", () => {
    const jd = `
      Java Developer — Some Consulting LLC
      Requirements (all required):
      Java AND Spring AND Oracle AND Hibernate required.
      - Java
      - Spring Boot
      - Oracle DB
      - SQL
      - Linux
      - REST APIs
      - Microservices
      - Maven
      - Jenkins
      - Docker
      - Git
      - Agile
      Bachelor's degree required. Must have all listed skills.
    `
    const r = analyzeJD(jd)
    expect(r.score).toBeGreaterThanOrEqual(35)
  })

  it("all signals are present in result", () => {
    const r = analyzeJD("some text")
    const ids = r.signals.map((s) => s.id)
    expect(ids).toContain("and_chaining")
    expect(ids).toContain("degree_overspecification")
    expect(ids).toContain("version_numbers")
    expect(ids).toContain("skills_density")
    expect(ids).toContain("known_employer")
    expect(ids).toContain("legal_language")
    expect(ids).toContain("no_human_language")
    expect(ids).toContain("perm_title")
  })
})
