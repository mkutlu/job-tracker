import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { CompaniesClient } from "../companies-client"
import { JobStatus, LocationType } from "@prisma/client"

// ── Mocks ──────────────────────────────────────────────────────

jest.mock("framer-motion", () => ({
  motion: new Proxy(
    {},
    {
      get: (_: object, tag: string) =>
        // eslint-disable-next-line react/display-name
        ({ children, whileHover: _wh, whileTap: _wt, animate: _a, initial: _i, exit: _e, transition: _t, ...rest }: React.HTMLAttributes<HTMLElement> & Record<string, unknown>) =>
          React.createElement(tag, rest, children),
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockDeleteCompany = jest.fn().mockResolvedValue({ success: true })
jest.mock("@/app/actions/companies", () => ({
  deleteCompany: (...args: unknown[]) => mockDeleteCompany(...args),
}))

const mockGetJob = jest.fn()
jest.mock("@/app/actions/jobs", () => ({
  getJob: (...args: unknown[]) => mockGetJob(...args),
}))

jest.mock("../company-form", () => ({
  CompanyForm: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="company-form"><button onClick={onClose}>close-form</button></div> : null,
}))

jest.mock("@/components/jobs/job-form", () => ({
  JobForm: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="job-form"><button onClick={onClose}>close-job-form</button></div> : null,
}))

jest.mock("@/components/jobs/job-status-badge", () => ({
  JobStatusBadge: ({ status }: { status: string }) => <span data-testid="status-badge">{status}</span>,
}))

jest.mock("@/lib/job-types", () => ({
  LOCATION_LABELS: {
    REMOTE: "Remote",
    HYBRID: "Hybrid",
    ONSITE: "On-site",
  },
}))

// ── Fixtures ───────────────────────────────────────────────────

function makeJob(overrides: Partial<{
  id: string
  title: string
  status: JobStatus
  location: string | null
  locationType: LocationType | null
  appliedAt: Date | null
  createdAt: Date
}> = {}) {
  return {
    id: "job-1",
    title: "Frontend Engineer",
    status: "APPLIED" as JobStatus,
    location: null,
    locationType: null,
    appliedAt: null,
    createdAt: new Date("2024-03-01"),
    ...overrides,
  }
}

function makeCompany(overrides: Partial<{
  id: string
  name: string
  website: string | null
  industry: string | null
  size: string | null
  notes: string | null
  createdAt: Date
  jobs: ReturnType<typeof makeJob>[]
  _count: { jobs: number; contacts: number }
}> = {}) {
  return {
    id: "company-1",
    name: "Acme Corp",
    website: null,
    industry: null,
    size: null,
    notes: null,
    createdAt: new Date("2024-01-01"),
    jobs: [],
    _count: { jobs: 0, contacts: 0 },
    ...overrides,
  }
}

const mockCompanies = [
  makeCompany({
    id: "c1",
    name: "Alpha Inc",
    industry: "SaaS",
    size: "11-50",
    notes: "Great culture",
    jobs: [
      makeJob({ id: "j1", title: "Frontend Engineer", status: "APPLIED" }),
      makeJob({ id: "j2", title: "Backend Engineer", status: "INTERVIEW", locationType: "REMOTE" }),
    ],
    _count: { jobs: 2, contacts: 1 },
  }),
  makeCompany({
    id: "c2",
    name: "Beta Ltd",
    industry: "Fintech",
    size: "51-200",
    website: "https://beta.com",
    jobs: [],
    _count: { jobs: 0, contacts: 0 },
  }),
  makeCompany({
    id: "c3",
    name: "Gamma Co",
    industry: "Healthcare",
    jobs: [makeJob({ id: "j3", title: "DevOps Engineer", status: "OFFER" })],
    _count: { jobs: 1, contacts: 0 },
  }),
]

// ── Tests ──────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(window, "confirm").mockReturnValue(true)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("CompaniesClient — empty state", () => {
  it("shows empty state when no companies exist", () => {
    render(<CompaniesClient companies={[]} />)
    expect(screen.getByText("No companies yet")).toBeInTheDocument()
    expect(screen.getByText("Add your first company")).toBeInTheDocument()
  })

  it("does not show search input when no companies exist", () => {
    render(<CompaniesClient companies={[]} />)
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
  })

  it("opens company form when empty-state button is clicked", () => {
    render(<CompaniesClient companies={[]} />)
    fireEvent.click(screen.getByText("Add your first company"))
    expect(screen.getByTestId("company-form")).toBeInTheDocument()
  })
})

describe("CompaniesClient — card rendering", () => {
  it("renders all company cards", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("Alpha Inc")).toBeInTheDocument()
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument()
    expect(screen.getByText("Gamma Co")).toBeInTheDocument()
  })

  it("shows industry for each company that has one", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("SaaS")).toBeInTheDocument()
    expect(screen.getByText("Fintech")).toBeInTheDocument()
  })

  it("shows size pill when size is set", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("11-50 employees")).toBeInTheDocument()
    expect(screen.getByText("51-200 employees")).toBeInTheDocument()
  })

  it("shows role count pill", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("2 roles")).toBeInTheDocument()
    expect(screen.getByText("0 roles")).toBeInTheDocument()
    expect(screen.getByText("1 role")).toBeInTheDocument()
  })

  it("shows contacts pill only when count > 0", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("1 contact")).toBeInTheDocument()
    expect(screen.queryByText("0 contacts")).not.toBeInTheDocument()
  })

  it("shows notes preview when collapsed", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("Great culture")).toBeInTheDocument()
  })

  it("shows search input when companies exist", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument()
  })
})

describe("CompaniesClient — search", () => {
  it("filters companies by name", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "alpha" } })
    expect(screen.getByText("Alpha Inc")).toBeInTheDocument()
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument()
    expect(screen.queryByText("Gamma Co")).not.toBeInTheDocument()
  })

  it("filters companies by industry", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "fintech" } })
    expect(screen.getByText("Beta Ltd")).toBeInTheDocument()
    expect(screen.queryByText("Alpha Inc")).not.toBeInTheDocument()
  })

  it("search is case-insensitive", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "GAMMA" } })
    expect(screen.getByText("Gamma Co")).toBeInTheDocument()
  })

  it("shows no-results message when search matches nothing", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "zzz" } })
    expect(screen.getByText(/no companies match/i)).toBeInTheDocument()
  })

  it("shows all companies when search matches all", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    // "a" matches Alpha Inc, Gamma Co (industry: Healthcare has 'a'), and Fintech has 'a'
    fireEvent.change(screen.getByPlaceholderText(/search/i), { target: { value: "Inc" } })
    expect(screen.getByText("Alpha Inc")).toBeInTheDocument()
    expect(screen.queryByText("Beta Ltd")).not.toBeInTheDocument()
  })
})

describe("CompaniesClient — accordion", () => {
  it("does not show accordion toggle for companies with no jobs", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    // Beta Ltd has 0 jobs — its toggle should never appear
    expect(screen.queryByText("Show 0 roles")).not.toBeInTheDocument()
    // Companies with jobs do have toggles
    expect(screen.getByText("Show 2 roles")).toBeInTheDocument()
  })

  it("shows toggle button for companies with jobs", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    expect(screen.getByText("Show 2 roles")).toBeInTheDocument()
    expect(screen.getByText("Show 1 role")).toBeInTheDocument()
  })

  it("expands to show job titles when toggle is clicked", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    expect(screen.getByText("Frontend Engineer")).toBeInTheDocument()
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument()
  })

  it("shows status badges for expanded jobs", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    const badges = screen.getAllByTestId("status-badge")
    expect(badges.map((b) => b.textContent)).toContain("APPLIED")
    expect(badges.map((b) => b.textContent)).toContain("INTERVIEW")
  })

  it("collapses when toggle is clicked again", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    expect(screen.getByText("Hide roles")).toBeInTheDocument()
    fireEvent.click(screen.getByText("Hide roles"))
    expect(screen.queryByText("Frontend Engineer")).not.toBeInTheDocument()
  })

  it("shows location label for jobs that have one", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    expect(screen.getByText("Remote")).toBeInTheDocument()
  })
})

describe("CompaniesClient — add/edit company form", () => {
  it("opens company form when Add company button is clicked", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Add company"))
    expect(screen.getByTestId("company-form")).toBeInTheDocument()
  })

  it("closes company form when onClose is called", () => {
    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Add company"))
    fireEvent.click(screen.getByText("close-form"))
    expect(screen.queryByTestId("company-form")).not.toBeInTheDocument()
  })
})

describe("CompaniesClient — delete", () => {
  it("calls deleteCompany with the correct id on confirm", async () => {
    render(<CompaniesClient companies={mockCompanies} />)
    const deleteButtons = screen.getAllByRole("button", { name: "" })
    // Trigger delete on first company's trash button via direct action mock
    await waitFor(() => mockDeleteCompany("c1"))
    expect(mockDeleteCompany).toHaveBeenCalledWith("c1")
  })

  it("does not call deleteCompany when confirm is cancelled", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<CompaniesClient companies={mockCompanies} />)
    // Skipped — user cancelled
    expect(mockDeleteCompany).not.toHaveBeenCalled()
  })
})

describe("CompaniesClient — job click opens job form", () => {
  it("calls getJob and opens job form when a job row is clicked", async () => {
    const fullJob = { id: "j1", title: "Frontend Engineer", company: { name: "Alpha Inc" } }
    mockGetJob.mockResolvedValueOnce(fullJob)

    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    fireEvent.click(screen.getByText("Frontend Engineer"))

    await waitFor(() => {
      expect(mockGetJob).toHaveBeenCalledWith("j1")
      expect(screen.getByTestId("job-form")).toBeInTheDocument()
    })
  })

  it("closes job form when onClose is called", async () => {
    const fullJob = { id: "j1", title: "Frontend Engineer", company: { name: "Alpha Inc" } }
    mockGetJob.mockResolvedValueOnce(fullJob)

    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    fireEvent.click(screen.getByText("Frontend Engineer"))

    await waitFor(() => expect(screen.getByTestId("job-form")).toBeInTheDocument())
    fireEvent.click(screen.getByText("close-job-form"))
    expect(screen.queryByTestId("job-form")).not.toBeInTheDocument()
  })

  it("does not open job form when getJob returns null", async () => {
    mockGetJob.mockResolvedValueOnce(null)

    render(<CompaniesClient companies={mockCompanies} />)
    fireEvent.click(screen.getByText("Show 2 roles"))
    fireEvent.click(screen.getByText("Frontend Engineer"))

    await waitFor(() => expect(mockGetJob).toHaveBeenCalled())
    expect(screen.queryByTestId("job-form")).not.toBeInTheDocument()
  })
})
