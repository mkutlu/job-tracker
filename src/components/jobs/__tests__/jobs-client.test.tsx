import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { JobsClient } from "../jobs-client"
import { Prisma } from "@prisma/client"

// ── Mocks ──────────────────────────────────────────────────────

const mockGet = jest.fn()
const mockReplace = jest.fn()

jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  usePathname: () => "/jobs",
  useRouter: () => ({ replace: mockReplace }),
}))

jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_: object, tag: string) =>
        // eslint-disable-next-line react/display-name
        ({ children, whileHover: _wh, whileTap: _wt, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
          React.createElement(tag, rest, children),
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Stub child components so tests focus on filter/sort logic
jest.mock("../jobs-table", () => ({
  JobsTable: ({ jobs }: { jobs: { id: string; title: string }[] }) => (
    <ul data-testid="jobs-table">
      {jobs.map((j) => <li key={j.id} data-testid="job-row">{j.title}</li>)}
    </ul>
  ),
}))

jest.mock("../jobs-filters", () => ({
  JobsFilters: () => <div data-testid="jobs-filters" />,
  EMPTY_FILTERS: {
    statuses: [], priorities: [], locationTypes: [], sources: [],
    minExcitement: null, days: null,
  },
}))

jest.mock("../job-form", () => ({
  JobForm: () => null,
}))

// ── Fixtures ───────────────────────────────────────────────────

type JobWithCompany = Prisma.JobGetPayload<{
  include: { company: { select: { name: true } } }
}>

function makeJob(overrides: Partial<JobWithCompany> & { companyName?: string } = {}): JobWithCompany {
  const { companyName = "Acme", ...rest } = overrides
  return {
    id: "job-1",
    userId: "user-1",
    title: "Frontend Engineer",
    status: "APPLIED",
    priority: "MEDIUM",
    excitement: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: "USD",
    locationType: null,
    location: null,
    source: null,
    nextStepAt: null,
    recruiterName: null,
    appliedAt: null,
    offerAmount: null,
    notes: null,
    jobDescription: null,
    companyId: "company-1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    company: { name: companyName },
    ...rest,
  }
}

const mockJobs: JobWithCompany[] = [
  makeJob({ id: "1", title: "Alpha Role",   status: "APPLIED",    priority: "HIGH",   salaryMin: 80000,  companyName: "ZZZ Corp",  locationType: "REMOTE",  source: "LINKEDIN",  createdAt: new Date("2024-01-10") }),
  makeJob({ id: "2", title: "Beta Role",    status: "REJECTED",   priority: "LOW",    salaryMin: 60000,  companyName: "AAA Corp",  locationType: "ONSITE",  source: "REFERRAL",  createdAt: new Date("2024-01-20") }),
  makeJob({ id: "3", title: "Gamma Role",   status: "INTERVIEW",  priority: "MEDIUM", salaryMin: 120000, companyName: "MMM Corp",  locationType: "HYBRID",  source: "RECRUITER", createdAt: new Date("2024-01-05") }),
]

function visibleTitles() {
  return screen.getAllByTestId("job-row").map((el) => el.textContent)
}

function setupParams(params: Record<string, string | null>) {
  mockGet.mockImplementation((key: string) => params[key] ?? null)
}

// ── Tests ──────────────────────────────────────────────────────

beforeEach(() => {
  mockGet.mockReturnValue(null)
  mockReplace.mockClear()
})

describe("JobsClient — header counts", () => {
  it("shows total application count in header", () => {
    setupParams({})
    render(<JobsClient jobs={mockJobs} />)
    expect(screen.getByText("3 applications tracked")).toBeInTheDocument()
  })

  it("shows singular 'application' when only one job", () => {
    setupParams({})
    render(<JobsClient jobs={[mockJobs[0]]} />)
    expect(screen.getByText("1 application tracked")).toBeInTheDocument()
  })
})

describe("JobsClient — status filter", () => {
  it("shows all jobs when no status filter is set", () => {
    setupParams({})
    render(<JobsClient jobs={mockJobs} />)
    expect(screen.getAllByTestId("job-row")).toHaveLength(3)
  })

  it("shows only matching jobs when status=APPLIED", () => {
    setupParams({ status: "APPLIED" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })

  it("shows matching jobs for multiple statuses", () => {
    setupParams({ status: "APPLIED,REJECTED" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toHaveLength(2)
    expect(visibleTitles()).toContain("Alpha Role")
    expect(visibleTitles()).toContain("Beta Role")
  })

  it("shows empty table when no jobs match the status filter", () => {
    setupParams({ status: "OFFER" })
    render(<JobsClient jobs={mockJobs} />)
    expect(screen.queryAllByTestId("job-row")).toHaveLength(0)
  })
})

describe("JobsClient — priority filter", () => {
  it("shows only HIGH priority jobs when priority=HIGH", () => {
    setupParams({ priority: "HIGH" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })

  it("shows multiple priority levels when combined", () => {
    setupParams({ priority: "HIGH,MEDIUM" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toHaveLength(2)
  })
})

describe("JobsClient — location filter", () => {
  it("shows only REMOTE jobs when loc=REMOTE", () => {
    setupParams({ loc: "REMOTE" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })
})

describe("JobsClient — source filter", () => {
  it("shows only LINKEDIN jobs when source=LINKEDIN", () => {
    setupParams({ source: "LINKEDIN" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })
})

describe("JobsClient — sort", () => {
  it("sorts by title asc when sort=title&dir=asc", () => {
    setupParams({ sort: "title", dir: "asc" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Alpha Role", "Beta Role", "Gamma Role"])
  })

  it("sorts by title desc when sort=title&dir=desc", () => {
    setupParams({ sort: "title", dir: "desc" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Gamma Role", "Beta Role", "Alpha Role"])
  })

  it("sorts by salary asc (lowest first) when sort=salary&dir=asc", () => {
    setupParams({ sort: "salary", dir: "asc" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Beta Role", "Alpha Role", "Gamma Role"])
  })

  it("sorts by salary desc (highest first) when sort=salary&dir=desc", () => {
    setupParams({ sort: "salary", dir: "desc" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Gamma Role", "Alpha Role", "Beta Role"])
  })

  it("sorts by added desc (newest first) by default", () => {
    setupParams({ sort: "added", dir: "desc" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Beta Role", "Alpha Role", "Gamma Role"])
  })

  it("sorts by company name asc when sort=company&dir=asc", () => {
    setupParams({ sort: "company", dir: "asc" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Beta Role", "Gamma Role", "Alpha Role"])
  })
})

describe("JobsClient — text search", () => {
  it("filters rows matching the search term in role title", () => {
    setupParams({})
    render(<JobsClient jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "alpha" } })
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })

  it("filters rows matching the search term in company name", () => {
    setupParams({})
    render(<JobsClient jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzz" } })
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })

  it("search is case-insensitive", () => {
    setupParams({})
    render(<JobsClient jobs={mockJobs} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "GAMMA" } })
    expect(visibleTitles()).toEqual(["Gamma Role"])
  })

  it("shows all rows when search is cleared", () => {
    setupParams({})
    render(<JobsClient jobs={mockJobs} />)
    const input = screen.getByPlaceholderText(/search/i)
    fireEvent.change(input, { target: { value: "alpha" } })
    fireEvent.change(input, { target: { value: "" } })
    expect(screen.getAllByTestId("job-row")).toHaveLength(3)
  })
})

describe("JobsClient — combined filters", () => {
  it("applies status + priority filters together", () => {
    setupParams({ status: "APPLIED", priority: "HIGH" })
    render(<JobsClient jobs={mockJobs} />)
    expect(visibleTitles()).toEqual(["Alpha Role"])
  })

  it("returns empty when combined filters match nothing", () => {
    setupParams({ status: "REJECTED", priority: "HIGH" })
    render(<JobsClient jobs={mockJobs} />)
    expect(screen.queryAllByTestId("job-row")).toHaveLength(0)
  })
})
